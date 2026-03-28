import {create} from 'zustand';

interface Message {
  type: 'user' | 'bot';
  content: string | React.ReactNode;
  time: string;
}

interface AppState {
  messages: Message[];
  userAnswers: { [key: string]: any };
  addMessage: (message: Message) => void;
  setUserAnswer: (key: string, value: any) => void;
}

export const useStore = create<AppState>((set) => ({
  messages: [],
  userAnswers: {
    travelSegments: [],
  },
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setUserAnswer: (key, value) =>
    set((state) => ({ userAnswers: { ...state.userAnswers, [key]: value } })),
}));
