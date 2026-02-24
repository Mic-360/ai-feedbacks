const logs = [];
const originalError = console.error;

console.error = function (...args) {
    logs.push(JSON.stringify(args));
    originalError.apply(console, args);
};

// Intercept unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    logs.push("Unhandled Promise Rejection: " + event.reason);
});

// Listen for requests from the content script to send the data back
window.addEventListener("message", (event) => {
    if (event.data.type === "GET_METADATA") {
        window.postMessage({ type: "SEND_METADATA", logs: logs }, "*");
    }
});
