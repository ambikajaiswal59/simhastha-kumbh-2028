import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Button,
} from "@mui/material";

const SuitableLandForm = ({
  proximity,
  setProximity,
  toiletSheet,
  setToiletSheet,
  handleToiletAnalysis,
}) => {
  return (
    <Paper
      elevation={3}
      sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
    >
      {/* Toilet Sheet Dropdown */}
      <FormControl fullWidth size="small">
        <InputLabel id="toilet-sheet-label">No. of Toilet Seat</InputLabel>
        <Select
          labelId="toilet-sheet-label"
          id="toilet-sheet"
          value={toiletSheet}
          label="No. of Toilet Sheet"
          onChange={(e) => setToiletSheet(e.target.value)}
        >
          <MenuItem value="">Select number</MenuItem>
          {[5, 10, 20, 30, 60, 90, 100, 150, 200, 250].map((num) => (
            <MenuItem key={num} value={num}>
              {num} Seat
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Proximity Dropdown */}
      <FormControl fullWidth size="small">
        <InputLabel id="proximity-label">Proximity with</InputLabel>
        <Select
          labelId="proximity-label"
          id="proximity-with"
          value={proximity}
          label="Proximity with"
          onChange={(e) => setProximity(e.target.value)}
        >
          <MenuItem value="">Select Feature</MenuItem>
          <MenuItem value="temple">Temple</MenuItem>
          <MenuItem value="hotel">Hotel</MenuItem>
          <MenuItem value="parking">Parking</MenuItem>
          <MenuItem value="road">Road</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth size="small">
        <Button
          onClick={handleToiletAnalysis}
          variant="contained"
          color="warning"
        >
          Analyse
        </Button>
      </FormControl>
    </Paper>
  );
};

export default SuitableLandForm;
