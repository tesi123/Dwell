import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { JSX } from "react";
import { User } from "../libraries/User";

interface Props {
  user?: User;
  window?: () => Window;
}

export default function Home(props: Props): JSX.Element {
  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)", flexDirection: "column" }}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          p: 3,
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          height: "100%",
          backgroundImage: "url('https://live.staticflickr.com/1831/41196834150_96646047b0_b.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",  // Changed from "center" to "center 20%"
          backgroundRepeat: "no-repeat",
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.25)', // This adds a dark overlay
          },
        }}
      >
        <Box>
          <h1 className="font-poppins text-9xl text-blue-500" style={{ margin: 0 }}>
            D'WELL
          </h1>
          <h2 className="font-roboto text-8xl text-white mt-4 italic" style={{ margin: 0 }}>
            Dwell better. Dwell well.
          </h2>
        </Box>
      </Box>
    </Box>
  );
}