
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
    // { id: 3, label: "Toilet", field: "toilet" },
    // { id: 4, label: "Water", field: "water" },
    // { id: 5, label: "Medical", field: "medical" },
    // { id: 6, label: "Police", field: "police" },
    // { id: 7, label: "Electric", field: "electric" },
    { id: 8, label: "Ghat", field: "ghat" },
    { id: 9, label: "Temple", field: "temple" },
    { id: 10, label: "Demand", field: "Demand" },
    { id: 11, label: "Supply-Gap", field: "Supply" },
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        marginTop: 1,
        background: "#133b5c",
        boxShadow: "0 0px 0px 2px white",
      }}
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
          sx={{
            // Input text color
            "& .MuiInputBase-input": {
              color: "white",
            },

            // Label color
            "& .MuiInputLabel-root": {
              color: "white",
            },

            // Label color when focused
            "& .MuiInputLabel-root.Mui-focused": {
              color: "white",
            },

            // Outline border default
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "white",
              },
              "&:hover fieldset": {
                borderColor: "white",
              },
              "&.Mui-focused fieldset": {
                borderColor: "white",
              },
            },

            // Helper text (error message)
            "& .MuiFormHelperText-root": {
              color: "white",
            },
          }}
        />
      </FormControl>

      {/* Proximity Dropdown */}
      <FormControl fullWidth size="small">
        <InputLabel
          id="proximity-label"
          shrink
          sx={{
            color: "white",
            "&.Mui-focused": {
              color: "white",
            },
          }}
        >
          Proximity with
        </InputLabel>
        <Select
          labelId="proximity-label"
          id="proximity-with"
          multiple
          label="Proximity with"
          value={proximity || []}
          displayEmpty
          onChange={(e) => {
            const value = e.target.value;
            setProximity(typeof value === "string" ? value.split(",") : value);
          }}
          renderValue={(selected) => {
            if (!selected || selected.length === 0) {
              return <span style={{ color: "#ccc" }}>Select Feature</span>;
            }

            return priorityMap
              .filter((p) => selected.includes(p.field))
              .map((p) => p.label)
              .join(", ");
          }}
          sx={{
            color: "white",

            // Input text
            "& .MuiSelect-select": {
              color: "white",
            },

            // Border
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "white",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "white",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "white",
            },

            // Icon (dropdown arrow)
            "& .MuiSvgIcon-root": {
              color: "white",
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: "#333", // dropdown background
                color: "white",
              },
            },
          }}
        >
          {priorityMap.map((p) => (
            <MenuItem key={p.id} value={p.field}>
              <Checkbox
                checked={proximity.includes(p.field)}
                size="small"
                sx={{
                  color: "white",
                  "&.Mui-checked": {
                    color: "white",
                  },
                }}
              />
              {p.label}
            </MenuItem>
          ))}
        </Select>
        
      </FormControl>
      {/* <FormControl fullWidth size="small">
        <Button
          onClick={handleToiletAnalysis}
          variant="contained"
          color="warning"
        >
          Analyse
        </Button>
      </FormControl> */}
      <FormControl fullWidth size="small">
        <div className="w-full space-y-2">
          <Button
            onClick={handleToiletAnalysis}
            variant="contained"
            color="warning"
            fullWidth
          >
            Analyse
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() =>
                window.dispatchEvent(new Event("toggle-site-priority-pause"))
              }
              variant="outlined"
              sx={{ flex: 1, color: "white", borderColor: "white" }}
            >
              Pause
            </Button>

            <Button
              onClick={() =>
                window.dispatchEvent(new Event("clear-site-priority"))
              }
              variant="outlined"
              color="error"
              sx={{ flex: 1 }}
            >
              Clear
            </Button>
          </div>
        </div>
      </FormControl>
    </Paper>
  );
};

export default SuitableLandForm;
