using System;
using System.Windows.Forms;
using System.Drawing;
using System.IO;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;
using System.Text;
using System.Linq;

namespace NumericAdjuster
{
    // 한 행의 모든 VERTICAL 측정값 저장용 모델
    public class MeasurementRecord
    {
        public int RowIndex { get; set; }
        public decimal? VerticalNum { get; set; }
        
        public decimal? VerticalUpperDiameter1 { get; set; }
        public decimal? VerticalUpperDiameter2 { get; set; }
        public decimal? VerticalUpperDiameterAvg { get; set; }
        
        public decimal? VerticalLowerDiameter1 { get; set; }
        public decimal? VerticalLowerDiameter2 { get; set; }
        
        public decimal? VerticalLeftLength1 { get; set; }
        public decimal? VerticalLeftLength2 { get; set; }
        
        public decimal? VerticalRightLength1 { get; set; }
        public decimal? VerticalRightLength2 { get; set; }
        
        public decimal? VerticalLeftRoundness1 { get; set; }
        public decimal? VerticalLeftRoundness2 { get; set; }
        
        public decimal? VerticalRightRoundness1 { get; set; }
        public decimal? VerticalRightRoundness2 { get; set; }
        
        public decimal? VerticalLeftAngle1 { get; set; }
        public decimal? VerticalLeftAngle2 { get; set; }
        
        public decimal? VerticalRightAngle1 { get; set; }
        public decimal? VerticalRightAngle2 { get; set; }
    }

    public class JudgmentRecord
    {
        public int MeasurementId { get; set; }
        public int RowIndex { get; set; }
        public string ItemName { get; set; }
        public decimal MeasuredValue { get; set; }
        public decimal UpperLimit { get; set; }
        public decimal LowerLimit { get; set; }
        public string Judgment { get; set; }
        public string FailReason { get; set; }
    }

    public class ThresholdSetting
    {
        public string ItemName { get; set; }
        public decimal UpperLimit { get; set; }
        public decimal LowerLimit { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class NumericAdjusterForm : Form
    {
        private NumericUpDown upperDiameterUpperUpDown;
        private NumericUpDown upperDiameterLowerUpDown;
        private NumericUpDown lowerDiameterUpperUpDown;
        private NumericUpDown lowerDiameterLowerUpDown;
        private NumericUpDown leftLengthUpperUpDown;
        private NumericUpDown leftLengthLowerUpDown;
        private NumericUpDown rightLengthUpperUpDown;
        private NumericUpDown rightLengthLowerUpDown;
        private NumericUpDown leftRoundnessUpperUpDown;
        private NumericUpDown leftRoundnessLowerUpDown;
        private NumericUpDown rightRoundnessUpperUpDown;
        private NumericUpDown rightRoundnessLowerUpDown;
        private NumericUpDown leftAngleUpperUpDown;
        private NumericUpDown leftAngleLowerUpDown;
        private NumericUpDown rightAngleUpperUpDown;
        private NumericUpDown rightAngleLowerUpDown;
        
        private Button saveUpperDiameterButton;
        private Button saveLowerDiameterButton;
        private Button saveLeftLengthButton;
        private Button saveRightLengthButton;
        private Button saveLeftRoundnessButton;
        private Button saveRightRoundnessButton;
        private Button saveLeftAngleButton;
        private Button saveRightAngleButton;
        
        private Button importCsvButton;
        private Button pauseResumeButton;
        private ProgressBar progressBar;
        private Label statusLabel;
        
        private Panel statisticsPanel;
        private Label totalCountLabel;
        private Label okCountLabel;
        private Label ngCountLabel;
        private Label yieldLabel;
        
        private Label dbSyncStatusLabel;
        private Label lastSyncTimeLabel;
        
        private TextBox resultTextBox;
        
        private string connectionString = "Server=3.35.71.119;Port=3306;Database=test;Uid=jho;Pwd=1234;Connect Timeout=10;";
        private string connectionStringWithoutDB = "Server=3.35.71.119;Port=3306;Uid=jho;Pwd=1234;Connect Timeout=10;";
        
        private CancellationTokenSource cancellationTokenSource;
        private bool isImporting = false;
        private bool isPaused = false;
        private ManualResetEventSlim pauseEvent = new ManualResetEventSlim(true);

        private System.Windows.Forms.Timer syncTimer;
        private DateTime lastSyncTime = DateTime.MinValue;
        private bool isSyncing = false;

        public NumericAdjusterForm()
        {
            InitializeComponents();
            TestDatabaseConnection();
            StartThresholdSyncTimer();
        }

        private void InitializeComponents()
        {
            this.Text = "Vision Monitor - 양방향 DB 동기화 (8개 항목)";
            this.Size = new Size(950, 1000);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.MaximizeBox = true;
            this.BackColor = Color.WhiteSmoke;
            this.AutoScroll = true;

            int yPos = 10;

            Label titleLabel = new Label
            {
                Location = new Point(30, yPos),
                Size = new Size(870, 30),
                Text = "[ 8개 측정 항목 - 상한치/하한치 (양방향 동기화) ]",
                Font = new Font("맑은 고딕", 12, FontStyle.Bold),
                ForeColor = Color.FromArgb(46, 78, 121)
            };
            this.Controls.Add(titleLabel);
            yPos += 40;

            Panel syncStatusPanel = new Panel
            {
                Location = new Point(30, yPos),
                Size = new Size(870, 60),
                BackColor = Color.FromArgb(230, 244, 255),
                BorderStyle = BorderStyle.FixedSingle
            };
            this.Controls.Add(syncStatusPanel);

            dbSyncStatusLabel = new Label
            {
                Location = new Point(15, 10),
                Size = new Size(840, 25),
                Text = "🔄 DB 동기화: 대기 중...",
                Font = new Font("맑은 고딕", 10, FontStyle.Bold),
                ForeColor = Color.FromArgb(0, 100, 200)
            };
            syncStatusPanel.Controls.Add(dbSyncStatusLabel);

            lastSyncTimeLabel = new Label
            {
                Location = new Point(15, 35),
                Size = new Size(840, 20),
                Text = "마지막 동기화: - | ✅ C#/웹 양방향 동기화",
                Font = new Font("맑은 고딕", 9),
                ForeColor = Color.Gray
            };
            syncStatusPanel.Controls.Add(lastSyncTimeLabel);

            yPos += 70;

            CreateLimitControls("UPPER_DIAMETER", ref upperDiameterUpperUpDown, ref upperDiameterLowerUpDown, ref saveUpperDiameterButton, ref yPos, 46.106m, 45.994m);
            CreateLimitControls("LOWER_DIAMETER", ref lowerDiameterUpperUpDown, ref lowerDiameterLowerUpDown, ref saveLowerDiameterButton, ref yPos, 46.04m, 45.96m);
            CreateLimitControls("LEFT_LENGTH", ref leftLengthUpperUpDown, ref leftLengthLowerUpDown, ref saveLeftLengthButton, ref yPos, 103.88m, 103.72m);
            CreateLimitControls("RIGHT_LENGTH", ref rightLengthUpperUpDown, ref rightLengthLowerUpDown, ref saveRightLengthButton, ref yPos, 103.88m, 103.72m);
            CreateLimitControls("LEFT_ROUNDNESS", ref leftRoundnessUpperUpDown, ref leftRoundnessLowerUpDown, ref saveLeftRoundnessButton, ref yPos, 1.5m, 0m);
            CreateLimitControls("RIGHT_ROUNDNESS", ref rightRoundnessUpperUpDown, ref rightRoundnessLowerUpDown, ref saveRightRoundnessButton, ref yPos, 1.5m, 0m);
            CreateLimitControls("LEFT_ANGLE", ref leftAngleUpperUpDown, ref leftAngleLowerUpDown, ref saveLeftAngleButton, ref yPos, 0.12m, 0m);
            CreateLimitControls("RIGHT_ANGLE", ref rightAngleUpperUpDown, ref rightAngleLowerUpDown, ref saveRightAngleButton, ref yPos, 0.12m, 0m);

            Label separatorLabel = new Label
            {
                Location = new Point(30, yPos),
                Size = new Size(870, 2),
                BorderStyle = BorderStyle.Fixed3D
            };
            this.Controls.Add(separatorLabel);
            yPos += 15;

            Label section2Label = new Label
            {
                Location = new Point(30, yPos),
                Size = new Size(870, 25),
                Text = "[ CSV 실시간 임포트 + OK/NG 판정 ]",
                Font = new Font("맑은 고딕", 11, FontStyle.Bold),
                ForeColor = Color.FromArgb(46, 78, 121)
            };
            this.Controls.Add(section2Label);
            yPos += 35;

            importCsvButton = new Button
            {
                Location = new Point(30, yPos),
                Size = new Size(200, 50),
                Text = "CSV 가져오기",
                Font = new Font("맑은 고딕", 11, FontStyle.Bold),
                BackColor = Color.FromArgb(144, 238, 144),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            importCsvButton.FlatAppearance.BorderSize = 0;
            importCsvButton.Click += ImportCsvButton_Click;
            this.Controls.Add(importCsvButton);

            pauseResumeButton = new Button
            {
                Location = new Point(240, yPos),
                Size = new Size(150, 50),
                Text = "일시정지",
                Font = new Font("맑은 고딕", 11, FontStyle.Bold),
                BackColor = Color.FromArgb(255, 215, 0),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand,
                Enabled = false
            };
            pauseResumeButton.FlatAppearance.BorderSize = 0;
            pauseResumeButton.Click += PauseResumeButton_Click;
            this.Controls.Add(pauseResumeButton);

            progressBar = new ProgressBar
            {
                Location = new Point(400, yPos),
                Size = new Size(480, 25),
                Visible = false
            };
            this.Controls.Add(progressBar);

            statusLabel = new Label
            {
                Location = new Point(400, yPos + 30),
                Size = new Size(480, 20),
                Text = "",
                Font = new Font("맑은 고딕", 9),
                ForeColor = Color.DarkGreen,
                Visible = false
            };
            this.Controls.Add(statusLabel);
            yPos += 70;

            statisticsPanel = new Panel
            {
                Location = new Point(30, yPos),
                Size = new Size(870, 100),
                BackColor = Color.FromArgb(240, 248, 255),
                BorderStyle = BorderStyle.FixedSingle,
                Visible = false
            };
            this.Controls.Add(statisticsPanel);

            Label statsTitle = new Label
            {
                Location = new Point(10, 10),
                Size = new Size(850, 25),
                Text = "=== 실시간 통계 ===",
                Font = new Font("맑은 고딕", 11, FontStyle.Bold),
                ForeColor = Color.FromArgb(46, 78, 121),
                BackColor = Color.Transparent
            };
            statisticsPanel.Controls.Add(statsTitle);

            totalCountLabel = new Label
            {
                Location = new Point(30, 40),
                Size = new Size(200, 25),
                Text = "총 처리: 0개",
                Font = new Font("맑은 고딕", 10, FontStyle.Bold),
                BackColor = Color.Transparent
            };
            statisticsPanel.Controls.Add(totalCountLabel);

            okCountLabel = new Label
            {
                Location = new Point(240, 40),
                Size = new Size(200, 25),
                Text = "OK: 0개 (0.0%)",
                Font = new Font("맑은 고딕", 10),
                ForeColor = Color.Green,
                BackColor = Color.Transparent
            };
            statisticsPanel.Controls.Add(okCountLabel);

            ngCountLabel = new Label
            {
                Location = new Point(450, 40),
                Size = new Size(200, 25),
                Text = "NG: 0개 (0.0%)",
                Font = new Font("맑은 고딕", 10),
                ForeColor = Color.Red,
                BackColor = Color.Transparent
            };
            statisticsPanel.Controls.Add(ngCountLabel);

            yieldLabel = new Label
            {
                Location = new Point(30, 70),
                Size = new Size(810, 25),
                Text = "수율: 0.0%",
                Font = new Font("맑은 고딕", 11, FontStyle.Bold),
                ForeColor = Color.FromArgb(0, 100, 0),
                BackColor = Color.Transparent
            };
            statisticsPanel.Controls.Add(yieldLabel);

            yPos += 110;

            resultTextBox = new TextBox
            {
                Location = new Point(30, yPos),
                Size = new Size(870, 250),
                Multiline = true,
                ReadOnly = true,
                ScrollBars = ScrollBars.Vertical,
                Font = new Font("맑은 고딕", 9),
                Text = "=== Vision Monitor 양방향 DB 동기화 (8개 항목) ===\r\n\r\n" +
                       "✅ threshold_settings: 8개 행 (각 항목당 1개)\r\n" +
                       "✅ 웹 → C#: 웹에서 변경 → DB 저장 → C# 5초마다 자동 동기화\r\n" +
                       "✅ C# → 웹: C#에서 변경 → 저장 버튼 → DB 저장 → 웹 5초마다 자동 동기화\r\n" +
                       "✅ row_index 자동 증가: 여러 CSV 파일 연속 임포트 가능\r\n",
                BackColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle
            };
            this.Controls.Add(resultTextBox);
        }

        private void CreateLimitControls(string itemName, ref NumericUpDown upperUpDown, ref NumericUpDown lowerUpDown, ref Button saveButton, ref int yPos, decimal defaultUpper, decimal defaultLower)
        {
            Label itemLabel = new Label
            {
                Location = new Point(30, yPos),
                Size = new Size(180, 25),
                Text = itemName,
                Font = new Font("맑은 고딕", 10, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleLeft,
                BackColor = Color.LightSteelBlue,
                BorderStyle = BorderStyle.FixedSingle
            };
            this.Controls.Add(itemLabel);

            Label upperLabel = new Label
            {
                Location = new Point(220, yPos),
                Size = new Size(80, 25),
                Text = "상한:",
                Font = new Font("맑은 고딕", 9),
                TextAlign = ContentAlignment.MiddleRight
            };
            this.Controls.Add(upperLabel);

            upperUpDown = new NumericUpDown
            {
                Location = new Point(305, yPos),
                Size = new Size(120, 25),
                Minimum = -1000,
                Maximum = 1000,
                Value = defaultUpper,
                DecimalPlaces = 3,
                Increment = 0.1m,
                Font = new Font("맑은 고딕", 10),
                ReadOnly = false,
                BackColor = Color.White
            };
            this.Controls.Add(upperUpDown);

            Label lowerLabel = new Label
            {
                Location = new Point(440, yPos),
                Size = new Size(80, 25),
                Text = "하한:",
                Font = new Font("맑은 고딕", 9),
                TextAlign = ContentAlignment.MiddleRight
            };
            this.Controls.Add(lowerLabel);

            lowerUpDown = new NumericUpDown
            {
                Location = new Point(525, yPos),
                Size = new Size(120, 25),
                Minimum = -1000,
                Maximum = 1000,
                Value = defaultLower,
                DecimalPlaces = 3,
                Increment = 0.1m,
                Font = new Font("맑은 고딕", 10),
                ReadOnly = false,
                BackColor = Color.White
            };
            this.Controls.Add(lowerUpDown);

            saveButton = new Button
            {
                Location = new Point(660, yPos),
                Size = new Size(100, 25),
                Text = "💾 저장",
                Font = new Font("맑은 고딕", 9, FontStyle.Bold),
                BackColor = Color.FromArgb(100, 149, 237),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            saveButton.FlatAppearance.BorderSize = 0;
            
            NumericUpDown upperUpDownLocal = upperUpDown;
            NumericUpDown lowerUpDownLocal = lowerUpDown;
            string itemNameForEvent = itemName;
            
            saveButton.Click += (sender, e) => SaveThresholdToDatabase(itemNameForEvent, upperUpDownLocal.Value, lowerUpDownLocal.Value);
            
            this.Controls.Add(saveButton);

            yPos += 35;
        }

        private void SaveThresholdToDatabase(string itemName, decimal upperLimit, decimal lowerLimit)
        {
            try
            {
                string dbItemName = "vertical_" + itemName.ToLower();

                using (MySqlConnection connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    LogToConsole($"[DB] {itemName} Save started");

                    string updateQuery = @"
                        INSERT INTO threshold_settings (item_name, upper_limit, lower_limit, updated_by, updated_at)
                        VALUES (@item_name, @upper_limit, @lower_limit, 'C# Program', NOW())
                        ON DUPLICATE KEY UPDATE
                            upper_limit = @upper_limit,
                            lower_limit = @lower_limit,
                            updated_by = 'C# Program',
                            updated_at = NOW()
                    ";

                    using (MySqlCommand cmd = new MySqlCommand(updateQuery, connection))
                    {
                        cmd.Parameters.AddWithValue("@item_name", dbItemName);
                        cmd.Parameters.AddWithValue("@upper_limit", upperLimit);
                        cmd.Parameters.AddWithValue("@lower_limit", lowerLimit);
                        cmd.ExecuteNonQuery();
                    }
                }

                string logMessage = $"[{DateTime.Now:HH:mm:ss}] Save {itemName}: Upper={upperLimit:F3}, Lower={lowerLimit:F3}";
                resultTextBox.AppendText($"\r\n{logMessage}");
                LogToConsole($"[SUCCESS] {itemName} Save completed");

                MessageBox.Show($"{itemName} 저장 완료!\n\n상한: {upperLimit:F3}\n하한: {lowerLimit:F3}", 
                    "저장 완료", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                LogToConsole($"[ERROR] {itemName} Save failed: {ex.Message}");
                MessageBox.Show($"저장 실패!\n\n{ex.Message}", "오류", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void StartThresholdSyncTimer()
        {
            syncTimer = new System.Windows.Forms.Timer();
            syncTimer.Interval = 5000;
            syncTimer.Tick += SyncTimer_Tick;
            syncTimer.Start();
            
            LogToConsole("[TIMER] DB sync timer started (5 sec interval)");
            SyncThresholdsFromDatabase();
        }

        private void SyncTimer_Tick(object sender, EventArgs e)
        {
            SyncThresholdsFromDatabase();
        }

        private void SyncThresholdsFromDatabase()
        {
            if (isSyncing) return;
            
            try
            {
                isSyncing = true;
                
                List<ThresholdSetting> thresholds = LoadThresholdsFromDatabase();
                
                if (thresholds.Count == 0)
                {
                    dbSyncStatusLabel.Text = "⚠️ DB 동기화: 데이터 없음";
                    dbSyncStatusLabel.ForeColor = Color.Orange;
                    LogToConsole("[SYNC] No threshold data in DB");
                    return;
                }

                bool hasChanges = false;
                int changedCount = 0;

                foreach (var threshold in thresholds)
                {
                    bool updated = UpdateNumericUpDownFromThreshold(threshold);
                    if (updated)
                    {
                        hasChanges = true;
                        changedCount++;
                    }
                }

                lastSyncTime = DateTime.Now;
                lastSyncTimeLabel.Text = $"마지막 동기화: {lastSyncTime:HH:mm:ss} | ✅ C#/웹 양방향 동기화";

                if (hasChanges)
                {
                    dbSyncStatusLabel.Text = $"✅ DB 동기화 완료: {changedCount}개 항목 업데이트됨";
                    dbSyncStatusLabel.ForeColor = Color.Green;
                    
                    string logMessage = $"[{DateTime.Now:HH:mm:ss}] DB Sync: {changedCount} items updated";
                    resultTextBox.AppendText($"\r\n{logMessage}");
                    LogToConsole($"[SYNC] {changedCount} items updated");
                }
                else
                {
                    dbSyncStatusLabel.Text = "✅ DB 동기화: 변경사항 없음";
                    dbSyncStatusLabel.ForeColor = Color.FromArgb(0, 100, 200);
                }
            }
            catch (Exception ex)
            {
                dbSyncStatusLabel.Text = "❌ DB 동기화 실패";
                dbSyncStatusLabel.ForeColor = Color.Red;
                LogToConsole($"[ERROR] DB sync failed: {ex.Message}");
            }
            finally
            {
                isSyncing = false;
            }
        }

        private List<ThresholdSetting> LoadThresholdsFromDatabase()
        {
            List<ThresholdSetting> thresholds = new List<ThresholdSetting>();

            try
            {
                using (MySqlConnection connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    LogToConsole("[DB] Querying threshold_settings...");

                    string query = "SELECT item_name, upper_limit, lower_limit, updated_at FROM threshold_settings";

                    using (MySqlCommand cmd = new MySqlCommand(query, connection))
                    using (MySqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            thresholds.Add(new ThresholdSetting
                            {
                                ItemName = reader.GetString("item_name"),
                                UpperLimit = reader.GetDecimal("upper_limit"),
                                LowerLimit = reader.GetDecimal("lower_limit"),
                                UpdatedAt = reader.GetDateTime("updated_at")
                            });
                        }
                    }
                    
                    LogToConsole($"[DB] {thresholds.Count} thresholds loaded");
                }
            }
            catch (Exception ex)
            {
                LogToConsole($"[DB ERROR] Threshold query failed: {ex.Message}");
            }

            return thresholds;
        }

        private bool UpdateNumericUpDownFromThreshold(ThresholdSetting threshold)
        {
            bool updated = false;

            switch (threshold.ItemName)
            {
                case "vertical_upper_diameter":
                    if (upperDiameterUpperUpDown.Value != threshold.UpperLimit || 
                        upperDiameterLowerUpDown.Value != threshold.LowerLimit)
                    {
                        upperDiameterUpperUpDown.Value = threshold.UpperLimit;
                        upperDiameterLowerUpDown.Value = threshold.LowerLimit;
                        updated = true;
                    }
                    break;

                case "vertical_lower_diameter":
                    if (lowerDiameterUpperUpDown.Value != threshold.UpperLimit || 
                        lowerDiameterLowerUpDown.Value != threshold.LowerLimit)
                    {
                        lowerDiameterUpperUpDown.Value = threshold.UpperLimit;
                        lowerDiameterLowerUpDown.Value = threshold.LowerLimit;
                        updated = true;
                    }
                    break;

                case "vertical_left_length":
                    if (leftLengthUpperUpDown.Value != threshold.UpperLimit || 
                        leftLengthLowerUpDown.Value != threshold.LowerLimit)
                    {
                        leftLengthUpperUpDown.Value = threshold.UpperLimit;
                        leftLengthLowerUpDown.Value = threshold.LowerLimit;
                        updated = true;
                    }
                    break;

                case "vertical_right_length":
                    if (rightLengthUpperUpDown.Value != threshold.UpperLimit || 
                        rightLengthLowerUpDown.Value != threshold.LowerLimit)
                    {
                        rightLengthUpperUpDown.Value = threshold.UpperLimit;
                        rightLengthLowerUpDown.Value = threshold.LowerLimit;
                        updated = true;
                    }
                    break;

                case "vertical_left_roundness":
                    if (leftRoundnessUpperUpDown.Value != threshold.UpperLimit || 
                        leftRoundnessLowerUpDown.Value != threshold.LowerLimit)
                    {
                        leftRoundnessUpperUpDown.Value = threshold.UpperLimit;
                        leftRoundnessLowerUpDown.Value = threshold.LowerLimit;
                        updated = true;
                    }
                    break;

                case "vertical_right_roundness":
                    if (rightRoundnessUpperUpDown.Value != threshold.UpperLimit || 
                        rightRoundnessLowerUpDown.Value != threshold.LowerLimit)
                    {
                        rightRoundnessUpperUpDown.Value = threshold.UpperLimit;
                        rightRoundnessLowerUpDown.Value = threshold.LowerLimit;
                        updated = true;
                    }
                    break;

                case "vertical_left_angle":
                    if (leftAngleUpperUpDown.Value != threshold.UpperLimit || 
                        leftAngleLowerUpDown.Value != threshold.LowerLimit)
                    {
                        leftAngleUpperUpDown.Value = threshold.UpperLimit;
                        leftAngleLowerUpDown.Value = threshold.LowerLimit;
                        updated = true;
                    }
                    break;

                case "vertical_right_angle":
                    if (rightAngleUpperUpDown.Value != threshold.UpperLimit || 
                        rightAngleLowerUpDown.Value != threshold.LowerLimit)
                    {
                        rightAngleUpperUpDown.Value = threshold.UpperLimit;
                        rightAngleLowerUpDown.Value = threshold.LowerLimit;
                        updated = true;
                    }
                    break;
            }

            return updated;
        }

        private void TestDatabaseConnection()
        {
            try
            {
                LogToConsole("=========================================");
                LogToConsole("DB Connection Test Started");
                LogToConsole($"Server: 3.35.71.119");
                LogToConsole($"Database: test");
                LogToConsole("=========================================");
                
                CreateDatabaseIfNotExists();
                
                using (MySqlConnection connection = new MySqlConnection(connectionString))
                {
                    connection.Open();
                    LogToConsole("[SUCCESS] DB Connection Success!");
                    CreateTablesIfNotExists(connection);
                }
                
                LogToConsole("=========================================");
            }
            catch (Exception ex)
            {
                LogToConsole($"[ERROR] DB Connection Failed: {ex.Message}");
                LogToConsole($"[ERROR] Stack Trace: {ex.StackTrace}");
                
                MessageBox.Show($"DB 연결 실패!\n\n{ex.Message}\n\n네트워크 연결을 확인하세요.", 
                              "DB 연결 오류", 
                              MessageBoxButtons.OK, 
                              MessageBoxIcon.Error);
            }
        }

        private void CreateDatabaseIfNotExists()
        {
            using (MySqlConnection connection = new MySqlConnection(connectionStringWithoutDB))
            {
                connection.Open();
                LogToConsole("[DB] Creating/Checking database 'test'");
                using (MySqlCommand cmd = new MySqlCommand("CREATE DATABASE IF NOT EXISTS test", connection))
                {
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private void CreateTablesIfNotExists(MySqlConnection connection)
        {
            LogToConsole("[DB] Creating/Checking tables...");
            
            string createTable1 = @"
                CREATE TABLE IF NOT EXISTS vertical_measurements (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    row_index INT NOT NULL,
                    vertical_num DECIMAL(10, 3),
                    vertical_upper_diameter_1 DECIMAL(10, 3),
                    vertical_upper_diameter_2 DECIMAL(10, 3),
                    vertical_upper_diameter_avg DECIMAL(10, 3),
                    vertical_lower_diameter_1 DECIMAL(10, 3),
                    vertical_lower_diameter_2 DECIMAL(10, 3),
                    vertical_left_length_1 DECIMAL(10, 3),
                    vertical_left_length_2 DECIMAL(10, 3),
                    vertical_right_length_1 DECIMAL(10, 3),
                    vertical_right_length_2 DECIMAL(10, 3),
                    vertical_left_roundness_1 DECIMAL(10, 3),
                    vertical_left_roundness_2 DECIMAL(10, 3),
                    vertical_right_roundness_1 DECIMAL(10, 3),
                    vertical_right_roundness_2 DECIMAL(10, 3),
                    vertical_left_angle_1 DECIMAL(10, 3),
                    vertical_left_angle_2 DECIMAL(10, 3),
                    vertical_right_angle_1 DECIMAL(10, 3),
                    vertical_right_angle_2 DECIMAL(10, 3),
                    created_at DATETIME NOT NULL,
                    INDEX idx_row_index (row_index)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ";

            using (MySqlCommand cmd = new MySqlCommand(createTable1, connection))
            {
                cmd.ExecuteNonQuery();
            }
            LogToConsole("[DB] vertical_measurements table OK");

            string createTable2 = @"
                CREATE TABLE IF NOT EXISTS quality_judgments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    measurement_id INT NOT NULL,
                    row_index INT NOT NULL,
                    item_name VARCHAR(100) NOT NULL,
                    measured_value DECIMAL(10, 3) NOT NULL,
                    upper_limit DECIMAL(10, 3) NOT NULL,
                    lower_limit DECIMAL(10, 3) NOT NULL,
                    judgment ENUM('OK', 'NG') NOT NULL,
                    fail_reason VARCHAR(50),
                    created_at DATETIME NOT NULL,
                    INDEX idx_measurement_id (measurement_id),
                    INDEX idx_row_index (row_index),
                    INDEX idx_judgment (judgment),
                    FOREIGN KEY (measurement_id) REFERENCES vertical_measurements(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ";

            using (MySqlCommand cmd = new MySqlCommand(createTable2, connection))
            {
                cmd.ExecuteNonQuery();
            }
            LogToConsole("[DB] quality_judgments table OK");

            string createTable3 = @"
                CREATE TABLE IF NOT EXISTS threshold_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    item_name VARCHAR(100) NOT NULL UNIQUE,
                    upper_limit DECIMAL(10, 3) NOT NULL,
                    lower_limit DECIMAL(10, 3) NOT NULL,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    updated_by VARCHAR(50) DEFAULT 'admin',
                    INDEX idx_item_name (item_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ";

            using (MySqlCommand cmd = new MySqlCommand(createTable3, connection))
            {
                cmd.ExecuteNonQuery();
            }
            LogToConsole("[DB] threshold_settings table OK");

            string insertInitial = @"
                INSERT INTO threshold_settings (item_name, upper_limit, lower_limit) VALUES
                ('vertical_upper_diameter', 46.106, 45.994),
                ('vertical_lower_diameter', 46.040, 45.960),
                ('vertical_left_length', 103.880, 103.720),
                ('vertical_right_length', 103.880, 103.720),
                ('vertical_left_roundness', 1.500, 0.000),
                ('vertical_right_roundness', 1.500, 0.000),
                ('vertical_left_angle', 0.120, 0.000),
                ('vertical_right_angle', 0.120, 0.000)
                ON DUPLICATE KEY UPDATE item_name = item_name;
            ";

            using (MySqlCommand cmd = new MySqlCommand(insertInitial, connection))
            {
                cmd.ExecuteNonQuery();
            }
            
            LogToConsole("[DB] Initial threshold data checked/inserted");
            LogToConsole("[DB] All tables created/checked (data preserved)");
        }

        private void UpdateStatistics(int totalCount, int okCount, int ngCount)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(() => UpdateStatistics(totalCount, okCount, ngCount)));
                return;
            }

            totalCountLabel.Text = $"총 처리: {totalCount}개";
            
            double yieldPercentage = totalCount > 0 ? (okCount * 100.0 / totalCount) : 0;
            
            okCountLabel.Text = $"OK: {okCount}개 ({(totalCount > 0 ? okCount * 100.0 / totalCount : 0):F1}%)";
            ngCountLabel.Text = $"NG: {ngCount}개 ({(totalCount > 0 ? ngCount * 100.0 / totalCount : 0):F1}%)";
            yieldLabel.Text = $"수율: {yieldPercentage:F1}%";
            
            if (yieldPercentage >= 95)
                yieldLabel.ForeColor = Color.Green;
            else if (yieldPercentage >= 85)
                yieldLabel.ForeColor = Color.Orange;
            else
                yieldLabel.ForeColor = Color.Red;
        }

        private void PrintJudgmentLog(MeasurementRecord record, List<JudgmentRecord> judgments)
        {
            int okCount = judgments.Count(j => j.Judgment == "OK");
            int ngCount = judgments.Count(j => j.Judgment == "NG");
            
            string statusIcon = ngCount > 0 ? "X" : "O";
            string logLine = $"[{DateTime.Now:HH:mm:ss}] Row {record.RowIndex}: {statusIcon} OK:{okCount} NG:{ngCount}";
            
            if (ngCount > 0)
            {
                foreach (var judgment in judgments.Where(j => j.Judgment == "NG"))
                {
                    string failReason = judgment.FailReason == "상한치 초과" ? "Over Upper" : "Under Lower";
                    logLine += $"\r\n  - {judgment.ItemName}: {failReason} (Value:{judgment.MeasuredValue:F3}, Upper:{judgment.UpperLimit:F3}, Lower:{judgment.LowerLimit:F3})";
                }
            }
            
            resultTextBox.AppendText($"\r\n{logLine}");
            
            LogToConsole($"[ROW {record.RowIndex}] OK:{okCount} NG:{ngCount} (Total: {judgments.Count} judgments)");
            foreach (var judgment in judgments.Where(j => j.Judgment == "NG"))
            {
                string failReason = judgment.FailReason == "상한치 초과" ? "Over Upper" : "Under Lower";
                LogToConsole($"  NG: {judgment.ItemName} - {failReason} (Value:{judgment.MeasuredValue:F3})");
            }
        }

        private void ImportCsvButton_Click(object sender, EventArgs e)
        {
            if (isImporting)
            {
                cancellationTokenSource?.Cancel();
                return;
            }

            OpenFileDialog openFileDialog = new OpenFileDialog
            {
                Filter = "CSV Files (*.csv)|*.csv|All Files (*.*)|*.*",
                Title = "Select CSV File"
            };

            if (openFileDialog.ShowDialog() == DialogResult.OK)
            {
                string filePath = openFileDialog.FileName;
                LogToConsole($"[CSV] Selected file: {filePath}");
                ImportCsvFile(filePath);
            }
        }

        private void PauseResumeButton_Click(object sender, EventArgs e)
        {
            if (isPaused)
            {
                pauseEvent.Set();
                isPaused = false;
                pauseResumeButton.Text = "일시정지";
                pauseResumeButton.BackColor = Color.FromArgb(255, 215, 0);
                LogToConsole("[IMPORT] Resumed");
            }
            else
            {
                pauseEvent.Reset();
                isPaused = true;
                pauseResumeButton.Text = "재개";
                pauseResumeButton.BackColor = Color.FromArgb(50, 205, 50);
                LogToConsole("[IMPORT] Paused");
            }
        }

        private async void ImportCsvFile(string filePath)
        {
            try
            {
                LogToConsole("=========================================");
                LogToConsole("CSV Import Started");
                LogToConsole("=========================================");
                
                List<MeasurementRecord> records = ReadCsvAndConvertToRecords(filePath);
                
                if (records.Count == 0)
                {
                    MessageBox.Show("유효한 데이터가 없습니다.", "오류", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                isImporting = true;
                isPaused = false;
                pauseEvent.Set();
                
                importCsvButton.Text = "취소";
                importCsvButton.BackColor = Color.FromArgb(255, 160, 122);
                pauseResumeButton.Enabled = true;
                
                progressBar.Visible = true;
                progressBar.Maximum = records.Count;
                progressBar.Value = 0;
                statusLabel.Visible = true;
                statisticsPanel.Visible = true;

                string startLog = $"[{DateTime.Now:HH:mm:ss}] CSV Loaded: {records.Count} rows (row_index: {records[0].RowIndex} ~ {records[records.Count - 1].RowIndex})";
                resultTextBox.AppendText($"\r\n{startLog}");
                LogToConsole($"[CSV] Total {records.Count} rows loaded (row_index: {records[0].RowIndex} ~ {records[records.Count - 1].RowIndex})");

                cancellationTokenSource = new CancellationTokenSource();
                var token = cancellationTokenSource.Token;

                int savedCount = 0;
                int failedCount = 0;
                int okRowCount = 0;
                int ngRowCount = 0;

                foreach (var record in records)
                {
                    if (token.IsCancellationRequested)
                    {
                        LogToConsole("[IMPORT] Cancelled by user");
                        break;
                    }

                    while (!pauseEvent.IsSet)
                    {
                        if (token.IsCancellationRequested)
                            break;
                        await Task.Delay(100, token);
                    }

                    int measurementId = SaveMeasurementToDatabase(record);
                    
                    if (measurementId > 0)
                    {
                        List<JudgmentRecord> judgments = ApplyRealTimeJudgment(record, measurementId);
                        SaveJudgmentsToDatabase(judgments);
                        
                        bool isRowOk = judgments.All(j => j.Judgment == "OK");
                        if (isRowOk)
                            okRowCount++;
                        else
                            ngRowCount++;
                        
                        PrintJudgmentLog(record, judgments);
                        
                        savedCount++;
                        UpdateStatistics(savedCount, okRowCount, ngRowCount);
                    }
                    else
                    {
                        failedCount++;
                        LogToConsole($"[ERROR] Row {record.RowIndex} save failed");
                    }

                    progressBar.Value = savedCount + failedCount;
                    statusLabel.Text = $"진행: {savedCount + failedCount}/{records.Count}";

                    await Task.Delay(600, token);
                }

                string completeLog = $"[{DateTime.Now:HH:mm:ss}] CSV Import Complete: Total {records.Count} | Success: {savedCount} | Failed: {failedCount} | OK: {okRowCount} | NG: {ngRowCount} | Yield: {(savedCount > 0 ? okRowCount * 100.0 / savedCount : 0):F1}%";
                resultTextBox.AppendText($"\r\n{completeLog}");
                
                LogToConsole("=========================================");
                LogToConsole($"CSV Import Completed");
                LogToConsole($"Total: {records.Count} | Success: {savedCount} | Failed: {failedCount}");
                LogToConsole($"OK: {okRowCount} | NG: {ngRowCount}");
                LogToConsole($"Yield: {(savedCount > 0 ? okRowCount * 100.0 / savedCount : 0):F1}%");
                LogToConsole("=========================================");

                MessageBox.Show($"완료!\n\n총: {records.Count}개\n성공: {savedCount}개\n실패: {failedCount}개\n\nOK: {okRowCount}개\nNG: {ngRowCount}개\n수율: {(savedCount > 0 ? okRowCount * 100.0 / savedCount : 0):F1}%", 
                    "완료", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                string errorLog = $"[{DateTime.Now:HH:mm:ss}] Error: {ex.Message}";
                resultTextBox.AppendText($"\r\n{errorLog}");
                LogToConsole($"[ERROR] {ex.Message}");
                LogToConsole($"[ERROR] Stack: {ex.StackTrace}");
                
                MessageBox.Show($"오류 발생!\n\n{ex.Message}", "오류", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                isImporting = false;
                isPaused = false;
                pauseEvent.Set();
                
                importCsvButton.Text = "CSV 가져오기";
                importCsvButton.BackColor = Color.FromArgb(144, 238, 144);
                pauseResumeButton.Enabled = false;
                
                progressBar.Visible = false;
                statusLabel.Visible = false;
            }
        }

        private List<JudgmentRecord> ApplyRealTimeJudgment(MeasurementRecord record, int measurementId)
        {
            List<JudgmentRecord> judgments = new List<JudgmentRecord>();

            if (record.VerticalUpperDiameter1.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_upper_diameter_1", record.VerticalUpperDiameter1.Value, upperDiameterUpperUpDown.Value, upperDiameterLowerUpDown.Value);
            if (record.VerticalUpperDiameter2.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_upper_diameter_2", record.VerticalUpperDiameter2.Value, upperDiameterUpperUpDown.Value, upperDiameterLowerUpDown.Value);
            if (record.VerticalUpperDiameterAvg.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_upper_diameter_avg", record.VerticalUpperDiameterAvg.Value, upperDiameterUpperUpDown.Value, upperDiameterLowerUpDown.Value);
            
            if (record.VerticalLowerDiameter1.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_lower_diameter_1", record.VerticalLowerDiameter1.Value, lowerDiameterUpperUpDown.Value, lowerDiameterLowerUpDown.Value);
            if (record.VerticalLowerDiameter2.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_lower_diameter_2", record.VerticalLowerDiameter2.Value, lowerDiameterUpperUpDown.Value, lowerDiameterLowerUpDown.Value);
            
            if (record.VerticalLeftLength1.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_left_length_1", record.VerticalLeftLength1.Value, leftLengthUpperUpDown.Value, leftLengthLowerUpDown.Value);
            if (record.VerticalLeftLength2.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_left_length_2", record.VerticalLeftLength2.Value, leftLengthUpperUpDown.Value, leftLengthLowerUpDown.Value);
            
            if (record.VerticalRightLength1.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_right_length_1", record.VerticalRightLength1.Value, rightLengthUpperUpDown.Value, rightLengthLowerUpDown.Value);
            if (record.VerticalRightLength2.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_right_length_2", record.VerticalRightLength2.Value, rightLengthUpperUpDown.Value, rightLengthLowerUpDown.Value);
            
            if (record.VerticalLeftRoundness1.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_left_roundness_1", record.VerticalLeftRoundness1.Value, leftRoundnessUpperUpDown.Value, leftRoundnessLowerUpDown.Value);
            if (record.VerticalLeftRoundness2.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_left_roundness_2", record.VerticalLeftRoundness2.Value, leftRoundnessUpperUpDown.Value, leftRoundnessLowerUpDown.Value);
            
            if (record.VerticalRightRoundness1.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_right_roundness_1", record.VerticalRightRoundness1.Value, rightRoundnessUpperUpDown.Value, rightRoundnessLowerUpDown.Value);
            if (record.VerticalRightRoundness2.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_right_roundness_2", record.VerticalRightRoundness2.Value, rightRoundnessUpperUpDown.Value, rightRoundnessLowerUpDown.Value);
            
            if (record.VerticalLeftAngle1.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_left_angle_1", record.VerticalLeftAngle1.Value, leftAngleUpperUpDown.Value, leftAngleLowerUpDown.Value);
            if (record.VerticalLeftAngle2.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_left_angle_2", record.VerticalLeftAngle2.Value, leftAngleUpperUpDown.Value, leftAngleLowerUpDown.Value);
            
            if (record.VerticalRightAngle1.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_right_angle_1", record.VerticalRightAngle1.Value, rightAngleUpperUpDown.Value, rightAngleLowerUpDown.Value);
            if (record.VerticalRightAngle2.HasValue)
                AddJudgment(judgments, measurementId, record.RowIndex, "vertical_right_angle_2", record.VerticalRightAngle2.Value, rightAngleUpperUpDown.Value, rightAngleLowerUpDown.Value);

            return judgments;
        }

        private void AddJudgment(List<JudgmentRecord> judgments, int measurementId, int rowIndex, string itemName, decimal value, decimal upper, decimal lower)
        {
            var judgment = new JudgmentRecord
            {
                MeasurementId = measurementId,
                RowIndex = rowIndex,
                ItemName = itemName,
                MeasuredValue = value,
                UpperLimit = upper,
                LowerLimit = lower
            };

            if (value > upper)
            {
                judgment.Judgment = "NG";
                judgment.FailReason = "Over Upper Limit";
            }
            else if (value < lower)
            {
                judgment.Judgment = "NG";
                judgment.FailReason = "Under Lower Limit";
            }
            else
            {
                judgment.Judgment = "OK";
                judgment.FailReason = null;
            }

            judgments.Add(judgment);
        }

        private int GetMaxRowIndexFromDatabase()
        {
            try
            {
                using (MySqlConnection connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = "SELECT IFNULL(MAX(row_index), 0) FROM vertical_measurements";
                    
                    using (MySqlCommand cmd = new MySqlCommand(query, connection))
                    {
                        object result = cmd.ExecuteScalar();
                        int maxRowIndex = result != null ? Convert.ToInt32(result) : 0;
                        LogToConsole($"[DB] Current max row_index: {maxRowIndex}");
                        return maxRowIndex;
                    }
                }
            }
            catch (Exception ex)
            {
                LogToConsole($"[DB ERROR] Max row_index query failed: {ex.Message}");
                return 0;
            }
        }

        private int SaveMeasurementToDatabase(MeasurementRecord record)
        {
            try
            {
                using (MySqlConnection connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    string query = @"
                        INSERT INTO vertical_measurements (
                            row_index, vertical_num, 
                            vertical_upper_diameter_1, vertical_upper_diameter_2, vertical_upper_diameter_avg,
                            vertical_lower_diameter_1, vertical_lower_diameter_2,
                            vertical_left_length_1, vertical_left_length_2,
                            vertical_right_length_1, vertical_right_length_2,
                            vertical_left_roundness_1, vertical_left_roundness_2,
                            vertical_right_roundness_1, vertical_right_roundness_2,
                            vertical_left_angle_1, vertical_left_angle_2,
                            vertical_right_angle_1, vertical_right_angle_2,
                            created_at
                        ) VALUES (
                            @row_index, @vertical_num,
                            @vertical_upper_diameter_1, @vertical_upper_diameter_2, @vertical_upper_diameter_avg,
                            @vertical_lower_diameter_1, @vertical_lower_diameter_2,
                            @vertical_left_length_1, @vertical_left_length_2,
                            @vertical_right_length_1, @vertical_right_length_2,
                            @vertical_left_roundness_1, @vertical_left_roundness_2,
                            @vertical_right_roundness_1, @vertical_right_roundness_2,
                            @vertical_left_angle_1, @vertical_left_angle_2,
                            @vertical_right_angle_1, @vertical_right_angle_2,
                            @created_at
                        );
                        SELECT LAST_INSERT_ID();
                    ";

                    using (MySqlCommand cmd = new MySqlCommand(query, connection))
                    {
                        cmd.Parameters.AddWithValue("@row_index", record.RowIndex);
                        cmd.Parameters.AddWithValue("@vertical_num", (object)record.VerticalNum ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_upper_diameter_1", (object)record.VerticalUpperDiameter1 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_upper_diameter_2", (object)record.VerticalUpperDiameter2 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_upper_diameter_avg", (object)record.VerticalUpperDiameterAvg ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_lower_diameter_1", (object)record.VerticalLowerDiameter1 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_lower_diameter_2", (object)record.VerticalLowerDiameter2 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_left_length_1", (object)record.VerticalLeftLength1 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_left_length_2", (object)record.VerticalLeftLength2 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_right_length_1", (object)record.VerticalRightLength1 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_right_length_2", (object)record.VerticalRightLength2 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_left_roundness_1", (object)record.VerticalLeftRoundness1 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_left_roundness_2", (object)record.VerticalLeftRoundness2 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_right_roundness_1", (object)record.VerticalRightRoundness1 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_right_roundness_2", (object)record.VerticalRightRoundness2 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_left_angle_1", (object)record.VerticalLeftAngle1 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_left_angle_2", (object)record.VerticalLeftAngle2 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_right_angle_1", (object)record.VerticalRightAngle1 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@vertical_right_angle_2", (object)record.VerticalRightAngle2 ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@created_at", DateTime.Now);
                        
                        object result = cmd.ExecuteScalar();
                        return Convert.ToInt32(result);
                    }
                }
            }
            catch (Exception ex)
            {
                LogToConsole($"[DB ERROR] Row {record.RowIndex} save failed: {ex.Message}");
                return -1;
            }
        }

        private void SaveJudgmentsToDatabase(List<JudgmentRecord> judgments)
        {
            try
            {
                using (MySqlConnection connection = new MySqlConnection(connectionString))
                {
                    connection.Open();

                    foreach (var judgment in judgments)
                    {
                        string query = @"
                            INSERT INTO quality_judgments (
                                measurement_id, row_index, item_name, measured_value,
                                upper_limit, lower_limit, judgment, fail_reason, created_at
                            ) VALUES (
                                @measurement_id, @row_index, @item_name, @measured_value,
                                @upper_limit, @lower_limit, @judgment, @fail_reason, @created_at
                            )
                        ";

                        using (MySqlCommand cmd = new MySqlCommand(query, connection))
                        {
                            cmd.Parameters.AddWithValue("@measurement_id", judgment.MeasurementId);
                            cmd.Parameters.AddWithValue("@row_index", judgment.RowIndex);
                            cmd.Parameters.AddWithValue("@item_name", judgment.ItemName);
                            cmd.Parameters.AddWithValue("@measured_value", judgment.MeasuredValue);
                            cmd.Parameters.AddWithValue("@upper_limit", judgment.UpperLimit);
                            cmd.Parameters.AddWithValue("@lower_limit", judgment.LowerLimit);
                            cmd.Parameters.AddWithValue("@judgment", judgment.Judgment);
                            cmd.Parameters.AddWithValue("@fail_reason", (object)judgment.FailReason ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@created_at", DateTime.Now);
                            
                            cmd.ExecuteNonQuery();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                LogToConsole($"[DB ERROR] Judgment save failed: {ex.Message}");
            }
        }

        private List<MeasurementRecord> ReadCsvAndConvertToRecords(string filePath)
        {
            List<MeasurementRecord> records = new List<MeasurementRecord>();
            
            try
            {
                string csvContent = File.ReadAllText(filePath, Encoding.UTF8);
                List<string[]> csvData = ParseCsv(csvContent);
                
                LogToConsole($"[CSV] Parsed rows: {csvData.Count}");
                
                if (csvData.Count == 0)
                    return records;

                string[] headers = csvData[0];
                Dictionary<string, int> columnMap = new Dictionary<string, int>();

                LogToConsole("[CSV] Column mapping:");
                for (int i = 0; i < headers.Length; i++)
                {
                    string header = headers[i].Trim().ToUpper();
                    
                    if (!columnMap.ContainsKey(header))
                    {
                        columnMap[header] = i;
                        if (header.StartsWith("VERTICAL_"))
                        {
                            LogToConsole($"  Column[{i}] = {header}");
                        }
                    }
                }

                int maxRowIndex = GetMaxRowIndexFromDatabase();
                LogToConsole($"[CSV] Current DB max row_index: {maxRowIndex}");
                LogToConsole($"[CSV] New data row_index starts from: {maxRowIndex + 1}");

                for (int rowIndex = 1; rowIndex < csvData.Count; rowIndex++)
                {
                    string[] columns = csvData[rowIndex];
                    
                    if (columns.Length == 0)
                        continue;

                    MeasurementRecord record = new MeasurementRecord
                    {
                        RowIndex = maxRowIndex + rowIndex,
                        
                        VerticalNum = GetDecimalValue(columns, columnMap, "VERTICAL_NUM"),
                        VerticalUpperDiameter1 = GetDecimalValue(columns, columnMap, "VERTICAL_UPPER_DIAMETER_1"),
                        VerticalUpperDiameter2 = GetDecimalValue(columns, columnMap, "VERTICAL_UPPER_DIAMETER_2"),
                        VerticalUpperDiameterAvg = GetDecimalValue(columns, columnMap, "VERTICAL_UPPER_DIAMETER_AVG"),
                        VerticalLowerDiameter1 = GetDecimalValue(columns, columnMap, "VERTICAL_LOWER_DIAMETER_1"),
                        VerticalLowerDiameter2 = GetDecimalValue(columns, columnMap, "VERTICAL_LOWER_DIAMETER_2"),
                        VerticalLeftLength1 = GetDecimalValue(columns, columnMap, "VERTICAL_LEFT_LENGTH_1"),
                        VerticalLeftLength2 = GetDecimalValue(columns, columnMap, "VERTICAL_LEFT_LENGTH_2"),
                        VerticalRightLength1 = GetDecimalValue(columns, columnMap, "VERTICAL_RIGHT_LENGTH_1"),
                        VerticalRightLength2 = GetDecimalValue(columns, columnMap, "VERTICAL_RIGHT_LENGTH_2"),
                        VerticalLeftRoundness1 = GetDecimalValue(columns, columnMap, "VERTICAL_LEFT_ROUNDNESS_1"),
                        VerticalLeftRoundness2 = GetDecimalValue(columns, columnMap, "VERTICAL_LEFT_ROUNDNESS_2"),
                        VerticalRightRoundness1 = GetDecimalValue(columns, columnMap, "VERTICAL_RIGHT_ROUNDNESS_1"),
                        VerticalRightRoundness2 = GetDecimalValue(columns, columnMap, "VERTICAL_RIGHT_ROUNDNESS_2"),
                        VerticalLeftAngle1 = GetDecimalValue(columns, columnMap, "VERTICAL_LEFT_ANGLE_1"),
                        VerticalLeftAngle2 = GetDecimalValue(columns, columnMap, "VERTICAL_LEFT_ANGLE_2"),
                        VerticalRightAngle1 = GetDecimalValue(columns, columnMap, "VERTICAL_RIGHT_ANGLE_1"),
                        VerticalRightAngle2 = GetDecimalValue(columns, columnMap, "VERTICAL_RIGHT_ANGLE_2")
                    };

                    records.Add(record);
                }

                LogToConsole($"[CSV] {records.Count} records created (row_index: {maxRowIndex + 1} ~ {maxRowIndex + records.Count})");
            }
            catch (Exception ex)
            {
                LogToConsole($"[CSV ERROR] {ex.Message}");
                LogToConsole($"[CSV ERROR] Stack: {ex.StackTrace}");
            }

            return records;
        }

        private List<string[]> ParseCsv(string csvContent)
        {
            List<string[]> rows = new List<string[]>();
            List<string> currentRow = new List<string>();
            StringBuilder currentField = new StringBuilder();
            bool inQuotes = false;
            
            for (int i = 0; i < csvContent.Length; i++)
            {
                char c = csvContent[i];
                char nextChar = (i + 1 < csvContent.Length) ? csvContent[i + 1] : '\0';
                
                if (inQuotes)
                {
                    if (c == '"')
                    {
                        if (nextChar == '"')
                        {
                            currentField.Append('"');
                            i++;
                        }
                        else
                        {
                            inQuotes = false;
                        }
                    }
                    else
                    {
                        currentField.Append(c);
                    }
                }
                else
                {
                    if (c == '"')
                        inQuotes = true;
                    else if (c == ',')
                    {
                        currentRow.Add(currentField.ToString());
                        currentField.Clear();
                    }
                    else if (c == '\r' && nextChar == '\n')
                    {
                        currentRow.Add(currentField.ToString());
                        currentField.Clear();
                        rows.Add(currentRow.ToArray());
                        currentRow.Clear();
                        i++;
                    }
                    else if (c == '\n')
                    {
                        currentRow.Add(currentField.ToString());
                        currentField.Clear();
                        rows.Add(currentRow.ToArray());
                        currentRow.Clear();
                    }
                    else
                    {
                        currentField.Append(c);
                    }
                }
            }
            
            if (currentField.Length > 0 || currentRow.Count > 0)
            {
                currentRow.Add(currentField.ToString());
                rows.Add(currentRow.ToArray());
            }
            
            return rows;
        }

        private decimal? GetDecimalValue(string[] columns, Dictionary<string, int> columnMap, string columnName)
        {
            try
            {
                if (columnMap.ContainsKey(columnName))
                {
                    int index = columnMap[columnName];
                    if (index < columns.Length)
                    {
                        string value = columns[index].Trim();
                        
                        if (string.IsNullOrWhiteSpace(value) || value == "\\N" || value.Equals("NULL", StringComparison.OrdinalIgnoreCase))
                            return null;
                        
                        if (decimal.TryParse(value, out decimal result))
                            return result;
                    }
                }
            }
            catch (Exception ex)
            {
                LogToConsole($"[ERROR] Failed to get '{columnName}' value: {ex.Message}");
            }
            
            return null;
        }

        private void LogToConsole(string message)
        {
            Console.WriteLine(message);
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            syncTimer?.Stop();
            syncTimer?.Dispose();
            base.OnFormClosing(e);
        }

        [STAThread]
        static void Main()
        {
            try
            {
                Console.OutputEncoding = Encoding.UTF8;
            }
            catch
            {
                try
                {
                    Console.OutputEncoding = Encoding.GetEncoding(949);
                }
                catch
                {
                    // Continue without encoding setup
                }
            }
            
            Console.WriteLine("=========================================");
            Console.WriteLine("  Vision Monitor - row_index auto increment");
            Console.WriteLine("  DB bidirectional sync + CSV continuous import");
            Console.WriteLine($"  Start: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            Console.WriteLine("=========================================");
            Console.WriteLine();
            
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new NumericAdjusterForm());
            
            Console.WriteLine();
            Console.WriteLine("=========================================");
            Console.WriteLine("  Program terminated");
            Console.WriteLine($"  {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            Console.WriteLine("=========================================");
        }
    }
}