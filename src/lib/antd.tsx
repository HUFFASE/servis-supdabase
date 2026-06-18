'use client';

import { App } from 'antd';
import { useEffect } from 'react';
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import { message as staticMessage, notification as staticNotification, Modal as staticModal } from 'antd';

let messageInstance: MessageInstance = staticMessage;
let notificationInstance: NotificationInstance = staticNotification;
let modalInstance: Omit<ModalStaticFunctions, 'warn'> = staticModal;

export default function AntdGlobalHelper() {
  const staticFunction = App.useApp();

  useEffect(() => {
    messageInstance = staticFunction.message;
    notificationInstance = staticFunction.notification;
    modalInstance = staticFunction.modal;
  }, [staticFunction]);

  return null;
}

export const message = new Proxy({} as MessageInstance, {
  get(target, prop) {
    return Reflect.get(messageInstance, prop);
  }
});

export const notification = new Proxy({} as NotificationInstance, {
  get(target, prop) {
    return Reflect.get(notificationInstance, prop);
  }
});

export const modal = new Proxy({} as Omit<ModalStaticFunctions, 'warn'>, {
  get(target, prop) {
    return Reflect.get(modalInstance, prop);
  }
});
