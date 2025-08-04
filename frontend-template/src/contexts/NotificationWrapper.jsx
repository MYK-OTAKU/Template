import React from 'react';
import { NotificationProvider } from './NotificationContext';

export const NotificationWrapper = ({ children }) => {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
};
