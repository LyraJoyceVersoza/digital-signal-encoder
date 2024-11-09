import React, { useRef, useState } from "react";

const SignalPlotter = () => {
  const [binaryInput, setBinaryInput] = useState("");
  const [voltage, setVoltage] = useState();
  const [encodingType, setEncodingType] = useState("NRZ-L");
  const canvasRef = useRef(null);

  const getEncodingFunction = (type) => {
    switch (type) {
      case "NRZ-L":
        return (data) => data.split("").map(bit => (bit === "1" ? voltage : -voltage));
      case "NRZ-I":
        let lastValue = -voltage;
        return (data) => data.split("").map(bit => {
          if (bit === "1") lastValue = -lastValue;
          return lastValue;
        });
      case "Bipolar AMI":
        let lastAMI = -voltage;
        return (data) => data.split("").map(bit => {
          if (bit === "1") {
            lastAMI = -lastAMI;
            return lastAMI;
          }
          return 0;
        });
      case "Pseudoternary":
        let lastPseudoternary = -voltage;
        return (data) => data.split("").map(bit => {
          if (bit === "0") {
            lastPseudoternary = -lastPseudoternary;
            return lastPseudoternary;
          }
          return 0;
        });
      case "Manchester":
        return (data) => data.split("").flatMap(bit => (bit === "1" ? [voltage, -voltage] : [-voltage, voltage]));
      case "Differential Manchester":
        let lastManchester = -voltage;
        return (data) => data.split("").flatMap(bit => {
          if (bit === "0") lastManchester = -lastManchester;
          return [lastManchester, -lastManchester];
        });
      default:
        return () => [];
    }
  };

  const plotSignal = () => {
    const encodeFunc = getEncodingFunction(encodingType);
    const signal = encodeFunc(binaryInput);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;
    const bitWidth = width / signal.length;

    ctx.clearRect(0, 0, width, height);

    //dynamic spacing based on voltage for horizontal lines
    const voltageLevels = Math.ceil(voltage * 2);
    const lineSpacing = height / (voltageLevels);

    // dynamic horizontal grid lines based on signal height and center at 0V
    for (let i = 0; i <= voltageLevels; i++) {
      const y = midY + (i - voltageLevels / 2) * lineSpacing;
      ctx.beginPath();
      ctx.strokeStyle = i === voltageLevels / 2 ? "#9c9a9a" : "#cccccc";
      ctx.lineWidth = i === voltageLevels / 2 ? 1.5 : 1;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      //y axis label
      const labelVoltage = (voltageLevels / 2 - i) * (voltage / (voltageLevels / 2));
      ctx.font = "12px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "right";
      ctx.fillText(`${labelVoltage.toFixed(1)}V`, width - 5, y + 5);
    }

    //vertical grid lines
    for (let x = 0; x < width; x += bitWidth) {
      ctx.beginPath();
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 1;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Plot the signal as a rectangular waveform on top of the grid
    ctx.beginPath();
    ctx.strokeStyle = "#007acc";
    ctx.lineWidth = 2;
    ctx.moveTo(0, midY - signal[0] * (height / 2) / voltage);

    for (let i = 0; i < signal.length; i++) {
      const x = i * bitWidth;
      const y = midY - signal[i] * (height / 2) / voltage;

      //horizontal line for current bit
      ctx.lineTo(x + bitWidth, y);

      //vertical transition line if next bit is different
      if (i < signal.length - 1 && signal[i] !== signal[i + 1]) {
        ctx.lineTo(x + bitWidth, midY - signal[i + 1] * (height / 2) / voltage);
      }
    }
    ctx.stroke();
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Digital Signal Plotter</h2>
      <div>
        <label>Binary Input: </label>
        <input
          type="text"
          value={binaryInput}
          onChange={(e) => setBinaryInput(e.target.value)}
        />
      </div>
      <div>
        <label>Voltage: </label>
        <input
          type="number"
          value={voltage}
          onChange={(e) => setVoltage(parseFloat(e.target.value))}
        />
      </div>
      <div>
        <label>Encoding Type: </label>
        <select value={encodingType} onChange={(e) => setEncodingType(e.target.value)}>
          <option value="NRZ-L">NRZ-L</option>
          <option value="NRZ-I">NRZ-I</option>
          <option value="Bipolar AMI">Bipolar AMI</option>
          <option value="Pseudoternary">Pseudoternary</option>
          <option value="Manchester">Manchester</option>
          <option value="Differential Manchester">Differential Manchester</option>
        </select>
      </div>
      <div>
        <button onClick={plotSignal}>Plot Signal</button>
      </div>
      
      <canvas ref={canvasRef} width={800} height={400} style={{ border: "1px solid #000", marginTop: "20px", padding: "30px" }}></canvas>
    </div>
  );
};

export default SignalPlotter;


