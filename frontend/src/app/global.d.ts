interface Window {
    electron: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        minimizeApp: () => void;
        runCommand: (command: Command) => void;
        resetSearch: (func: Function) => void;
        onNewCommands: (func: Function) => void;
        retrieveMRU: () => Promise<any>;
        onMRUChange: (func: Function) => void;
        onSettingsChange: (func: Function) => void;
        
        // Define other methods or properties you need`
    };
}

interface Command {
    title: string;
    description: string;
    tags: string[];
    disabled: boolean;
  }