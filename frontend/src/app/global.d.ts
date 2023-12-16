interface Window {
    electron: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        minimizeApp: () => void;
        runCommand: (command: string) => void;
        resetSearch: (func: Function) => void;
        retrieveMRU: () => Promise<any>;
        onMRUChange: (func: Function) => void;
        // Define other methods or properties you need`
    };
}