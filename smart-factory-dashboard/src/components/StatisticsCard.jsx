import React from "react";
import "../styles/StatisticsCard.css";

const StatisticsCard = ({ title, value, unit, icon, color }) => {
  return (
    <div className="statistics-card" style={{ borderLeftColor: color }}>
      <div className="card-header">
        <span className="card-icon" style={{ backgroundColor: color }}>
          {icon}
        </span>
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-body">
        <div className="card-value">
          {value !== null && value !== undefined ? value.toLocaleString() : "-"}
          {unit && <span className="card-unit">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatisticsCard;
