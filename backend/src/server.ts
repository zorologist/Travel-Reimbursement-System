// This process entry point starts the configured Express application on the selected port.
import { app } from "./app.js";

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
