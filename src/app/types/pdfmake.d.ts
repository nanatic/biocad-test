declare module 'pdfmake/build/pdfmake' {
  const pdfMake: {
    vfs?: Record<string, string>;
    addVirtualFileSystem?: (vfs: Record<string, string>) => void;
    createPdf: (docDefinition: unknown) => {
      download: (defaultFileName?: string) => void;
      open: () => void;
      print: () => void;
    };
  };

  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: {
    pdfMake?: { vfs?: Record<string, string> };
    vfs?: Record<string, string>;
    [key: string]: unknown;
  };

  export default pdfFonts;
}