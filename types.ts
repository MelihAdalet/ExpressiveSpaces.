
export interface Article {
  id: string;
  title: string;
  content: string;
  coverImage: string;
  date: string;
  category: string;
}

export interface ThemeSettings {
  seedColor: string;
  isDarkMode: boolean;
  isRainbowMode: boolean;
}

export interface AuthState {
  isLoggedIn: boolean;
}