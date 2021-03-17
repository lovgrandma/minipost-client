module.exports = {
    presets: [ "@babel/preset-env", "@babel/preset-react"],
    plugins: [
        [
            "@babel/plugin-proposal-class-properties",
            {
                "loose": true
            }
        ],
        [
            "@babel/plugin-transform-runtime", 
            {
                "asyncGenerators": true,
                "generators": true,
                "async": true
            }
        ],
        ["@babel/plugin-proposal-export-default-from"],
        [
            "@babel/plugin-transform-react-jsx",
            {
                "throwIfNamespace": false, // defaults to true
                "runtime": "automatic", // defaults to classic
                "importSource": "react" // defaults to react
            }
        ],
        ["transform-react-jsx"]
    ]
};