document.addEventListener("DOMContentLoaded", function() {
    const htmlInput = document.getElementById('html');
    const cssInput = document.getElementById('css');
    const jsInput = document.getElementById('js');
    const outputFrame = document.getElementById('output');
    const uploadFiles = document.getElementById('uploadFiles');
    const imageStore = {};
    const terminalIcon = document.getElementById('terminalIcon');
    const terminalOverlay = document.getElementById('terminalOverlay');
    const terminalInput = document.getElementById('terminalInput');
    const terminalOutput = document.getElementById('terminalOutput');

    function loadFromLocalStorage() {
        htmlInput.value = localStorage.getItem('html') || '';
        cssInput.value = localStorage.getItem('css') || '';
        jsInput.value = localStorage.getItem('js') || '';
        updateOutput();
    }

    function saveToLocalStorage() {
        localStorage.setItem('html', htmlInput.value);
        localStorage.setItem('css', cssInput.value);
        localStorage.setItem('js', jsInput.value);
    }

    function updateOutput() {
        let htmlCode = htmlInput.value;
        const cssCode = `<style>${cssInput.value}</style>`;
        const jsCode = `<script>${jsInput.value}</script>`;

        htmlCode = htmlCode.replace(/<img\s+src="([^"]+)"/g, (match, src) => {
            const imageUrl = imageStore[src] || src;
            return `<img src="${imageUrl}"` ;
        });

        const code = htmlCode + cssCode + jsCode;

        outputFrame.contentDocument.open();
        outputFrame.contentDocument.write(code);
        outputFrame.contentDocument.close();
    }

    htmlInput.addEventListener('input', updateOutput);
    cssInput.addEventListener('input', updateOutput);
    jsInput.addEventListener('input', updateOutput);
    window.addEventListener('beforeunload', saveToLocalStorage);

    loadFromLocalStorage();

    uploadFiles.addEventListener('change', function(event) {
        const files = event.target.files;

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = function(e) {
                    imageStore[file.name] = e.target.result;
                    updateOutput();
                };

                reader.readAsDataURL(file);
            }
        });
    });

    function openInNewTab() {
        let htmlCode = htmlInput.value;
        const cssCode = `<style>${cssInput.value}</style>`;
        const jsCode = `<script>${jsInput.value}</script>`;

        htmlCode = htmlCode.replace(/<img\s+src="([^"]+)"/g, (match, src) => {
            const imageUrl = imageStore[src] || src;
            return `<img src="${imageUrl}"` ;
        });

        const code = htmlCode + cssCode + jsCode;
        const newWindow = window.open();
        newWindow.document.write(code);
        newWindow.document.close();
    }

    document.getElementById('openInNewTab').addEventListener('click', openInNewTab);

    function captureConsole() {
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;

        console.log = function(...args) {
            originalConsoleLog(...args);
            appendToTerminal(args);
        };

        console.error = function(...args) {
            originalConsoleError(...args);
            appendToTerminal(args, true);
        };
    }

    function appendToTerminal(args, isError = false) {
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
        terminalOutput.value += (isError ? `Error: ${message}` : message) + '\n';
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function executeJSFromTextbox() {
        const jsCode = terminalInput.value;
        terminalOutput.value += `$ ${jsCode}\n`;

        try {
            new Function(jsCode)();
        } catch (error) {
            console.error(error.message);
        }
        terminalInput.value = '';
    }

    function toggleTerminal() {
        if (terminalOverlay.style.display === 'flex') {
            terminalOverlay.style.display = 'none';
        } else {
            terminalOverlay.style.display = 'flex';
            terminalInput.focus();
            terminalOutput.value = '';
        }
    }

    terminalIcon.addEventListener('click', toggleTerminal);

    terminalInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            executeJSFromTextbox();
        } else if (event.key === 'Enter' && event.shiftKey) {
            terminalInput.value += '\n';
            event.preventDefault();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === ' ') {
            toggleTerminal();
        }
    });

    captureConsole();
});
