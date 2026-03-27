import React, { useState } from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Button,
  Checkbox,
} from "@mui/material";

const SuitableLandForm = ({
  proximity,
  setProximity,
  toiletSheet,
  setToiletSheet,
  handleToiletAnalysis,
}) => {
  const priorityMap = [
    { id: 1, label: "Road", field: "road" },
    { id: 2, label: "Parking", field: "parking" },
    { id: 3, label: "Toilet", field: "toilet" },
    { id: 4, label: "Water", field: "water" },
    { id: 5, label: "Medical", field: "medical" },
    { id: 6, label: "Police", field: "police" },
    { id: 7, label: "Electric", field: "electric" },
    { id: 8, label: "River", field: "river" },
  ];

  return (
    <Paper
      elevation={3}
      sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
    >
      {/* Toilet Sheet Dropdown */}
      <FormControl fullWidth size="small">
        <TextField
          label="No. of Toilet Seat"
          id="toilet-sheet"
          type="number"
          size="small"
          fullWidth
          value={toiletSheet}
          onChange={(e) => setToiletSheet(e.target.value)}
          inputProps={{ min: 1 }}
          // placeholder="Enter number of seats"
        />
      </FormControl>

      {/* Proximity Dropdown */}
      <FormControl fullWidth size="small">
        <InputLabel id="proximity-label" shrink>
          Proximity with
        </InputLabel>
        <Select
          labelId="proximity-label"
          id="proximity-with"
          multiple
          label="Proximity with"
          value={proximity}
          displayEmpty
          onChange={(e) => {
            const value = e.target.value;
            setProximity(typeof value === "string" ? value.split(",") : value);
          }}
          renderValue={(selected) => {
            if (selected.length === 0) return;

            return priorityMap
              .filter((p) => selected.includes(p.field))
              .map((p) => p.label)
              .join(", ");
          }}
        >
          {priorityMap.map((p) => (
            <MenuItem key={p.id} value={p.field}>
              <Checkbox checked={proximity.includes(p.field)} size="small" />
              {p.label}
            </MenuItem>
          ))}
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
