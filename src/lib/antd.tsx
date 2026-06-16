'use client';

import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';

let messageInstance: MessageInstance;
let notificationInstance: NotificationInstance;
let modalInstance: Omit<ModalStaticFunctions, 'warn'>;

export default function AntdGlobalHelper() {
  const staticFunction = App.useApp();
  messageInstance = staticFunction.message;
  notificationInstance = staticFunction.notification;
  modalInstance = staticFunction.modal;
  return null;
}

const getMessage = (): MessageInstance => {
  if (!messageInstance) {
    if (typeof window !== 'undefined') {
      const { message: staticMessage } = require('antd');
      return staticMessage;
    }
  }
  return messageInstance;
};

const getNotification = (): NotificationInstance => {
  if (!notificationInstance) {
    if (typeof window !== 'undefined') {
      const { notification: staticNotification } = require('antd');
      return staticNotification;
    }
  }
  return notificationInstance;
};

const getModal = (): Omit<ModalStaticFunctions, 'warn'> => {
  if (!modalInstance) {
    if (typeof window !== 'undefined') {
      const { Modal } = require('antd');
      return Modal;
    }
  }
  return modalInstance;
};

export const message = new Proxy({} as MessageInstance, {
  get(target, prop) {
    const msg = getMessage();
    return msg ? (msg as any)[prop] : () => {};
  }
});

export const notification = new Proxy({} as NotificationInstance, {
  get(target, prop) {
    const notif = getNotification();
    return notif ? (notif as any)[prop] : () => {};
  }
});

export const modal = new Proxy({} as Omit<ModalStaticFunctions, 'warn'>, {
  get(target, prop) {
    const mdl = getModal();
    return mdl ? (mdl as any)[prop] : () => {};
  }
});
