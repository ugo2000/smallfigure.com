import { Config } from '@remotion/cli/config';

// 复用本机 playwright 的 chromium，避免 Remotion 再下载一份 headless shell
Config.setBrowserExecutable(
  'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'
);
Config.setOverwriteOutput(true);
