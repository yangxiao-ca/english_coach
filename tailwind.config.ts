import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        mist: "#F5F7F8",
        sage: "#6E8B7E",
        coral: "#D96C5F",
        gold: "#D8A63A"
      }
    }
  },
  plugins: []
};

export default config;
