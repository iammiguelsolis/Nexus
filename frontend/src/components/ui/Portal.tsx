import ReactDOM from 'react-dom';
import type { ReactNode } from 'react';

interface PortalProps {
  children: ReactNode;
}

export const Portal = ({ children }: PortalProps) => {
  return ReactDOM.createPortal(children, document.body);
};
