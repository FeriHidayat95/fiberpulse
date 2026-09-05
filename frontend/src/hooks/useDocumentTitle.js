import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = `${title} | Sistem Manajemen WiFi PT DR`;
  }, [title]);
};
