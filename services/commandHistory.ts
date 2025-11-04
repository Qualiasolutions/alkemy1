// Command Pattern for Undo/Redo functionality
// Inspired by Unreal Engine's command system

export interface Command<T = any> {
    id: string;
    name: string;
    timestamp: number;
    execute: () => T;
    undo: () => T;
    data?: any; // Store command-specific data
}

class CommandHistory {
    private history: Command[] = [];
    private currentIndex: number = -1;
    private maxHistorySize: number = 50;
    private listeners: Set<() => void> = new Set();

    // Execute a new command
    executeCommand(command: Command): void {
        // Remove any commands after current index (branching history)
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Execute the command
        command.execute();

        // Add to history
        this.history.push(command);
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        this.notifyListeners();
    }

    // Undo last command
    undo(): boolean {
        if (!this.canUndo()) return false;

        const command = this.history[this.currentIndex];
        command.undo();
        this.currentIndex--;

        this.notifyListeners();
        return true;
    }

    // Redo next command
    redo(): boolean {
        if (!this.canRedo()) return false;

        this.currentIndex++;
        const command = this.history[this.currentIndex];
        command.execute();

        this.notifyListeners();
        return true;
    }

    canUndo(): boolean {
        return this.currentIndex >= 0;
    }

    canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    getCurrentCommand(): Command | null {
        return this.history[this.currentIndex] || null;
    }

    getHistoryLength(): number {
        return this.history.length;
    }

    clear(): void {
        this.history = [];
        this.currentIndex = -1;
        this.notifyListeners();
    }

    // Subscribe to history changes
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    // Get history summary for debugging
    getHistorySummary(): { name: string; timestamp: number }[] {
        return this.history.map(cmd => ({
            name: cmd.name,
            timestamp: cmd.timestamp
        }));
    }
}

// Global singleton instance
export const commandHistory = new CommandHistory();

// Helper to create state update commands
export function createStateCommand<T>(
    name: string,
    getter: () => T,
    setter: (newState: T) => void,
    newState: T
): Command<T> {
    const oldState = getter();

    return {
        id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        timestamp: Date.now(),
        execute: () => {
            setter(newState);
            return newState;
        },
        undo: () => {
            setter(oldState);
            return oldState;
        },
        data: { oldState, newState }
    };
}
