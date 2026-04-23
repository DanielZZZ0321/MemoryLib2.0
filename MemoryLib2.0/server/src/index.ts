import "./load-env.js";
import { createApp } from "./app.js";
import { ensureBucketExists, isStorageConfigured } from "./services/storage.js";

const port = Number(process.env.PORT) || 3001;

const app = createApp();

app.listen(port, () => {
  console.log(`[memoria] server listening on http://localhost:${port}`);
  if (isStorageConfigured()) {
    ensureBucketExists().catch((e) =>
      console.warn("[memoria] MinIO bucket 预检失败（可首次上传时重试）:", e),
    );
  }
});
