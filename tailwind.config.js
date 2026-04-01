import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            colors: {
                'kgbi-gold': '#b58d3a',
                'kgbi-silver': '#c7ccd3',
                'kgbi-red': '#8d1922',
            },
            opacity: {
                4: '0.04',
                6: '0.06',
                18: '0.18',
                35: '0.35',
                55: '0.55',
                65: '0.65',
                72: '0.72',
                78: '0.78',
            },
            fontFamily: {
                sans: [
                    'Bahnschrift',
                    'Segoe UI Variable',
                    'Trebuchet MS',
                    ...defaultTheme.fontFamily.sans,
                ],
            },
        },
    },

    plugins: [forms],
};
