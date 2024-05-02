import { initMain } from "./main_modules/onload.js";
import { config, onUpdateConfig, loadUserConfig } from "./main_modules/config.js";

const { app, ipcMain, dialog, shell, BrowserWindow } = require("electron");

/**
 * 是否已经初始化
 */
let initConfig = false;

/**
 * 窗口创建时触发
 * @param {BrowserWindow} window window对象
 */
function onBrowserWindowCreated(window) {
  try {
    proxyIpcMessage(window);
    proxySend(window);
  } catch (err) {
    log("出现错误", err);
  }
}

function proxyIpcMessage(window) {
  const ipc_message_proxy = window.webContents._events["-ipc-message"]?.[0] || window.webContents._events["-ipc-message"];
  const proxyIpcMsg = new Proxy(ipc_message_proxy, {
    apply(target, thisArg, args) {
      return target.apply(thisArg, args);
    },
  });
  if (window.webContents._events["-ipc-message"]?.[0]) {
    window.webContents._events["-ipc-message"][0] = proxyIpcMsg;
  } else {
    window.webContents._events["-ipc-message"] = proxyIpcMsg;
  }
}
/**
 * 重写并监听ipc通信内容的函数。
 *
 * @param {BrowserWindow} window - 窗口对象。
 */
function proxySend(window) {
  // 复写并监听ipc通信内容
  const originalSend = window.webContents.send;
  window.webContents.send = (...args) => {
    if (!initConfig) {
      if (args?.[2]?.[0]?.cmdName === "nodeIKernelSessionListener/onSessionInitComplete") {
        loadUserConfig(args?.[2]?.[0]?.payload?.uid);
        initConfig = true;
      }
    }
    originalSend.call(window.webContents, ...args);
  };
}

module.exports = { onBrowserWindowCreated };