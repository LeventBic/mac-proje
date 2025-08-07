import React from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  path: string;
  isNew?: boolean;
  children?: MenuItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface NavigationState {
  sidebarOpen: boolean;
  activeMenuItem: string;
}