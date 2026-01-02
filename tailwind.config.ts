import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@heroui/react/node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    darkMode: "class",
    plugins: [heroui(), require("@tailwindcss/typography")],
};

export default config;
