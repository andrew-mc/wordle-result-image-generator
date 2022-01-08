(() => {
    const BASE_SIZE = 3;

    function createShareString(gameApp) {
        var s = gameApp.dayOffset,
            t = gameApp.rowIndex,
            o = gameApp.hardMode,
            r = gameApp.gameStatus === 'WIN',
            shareString = "Wordle ".concat(s);
        shareString += " ".concat(r ? t : "X", "/").concat(6), o && (shareString += "*");
        return shareString;
    }

    function createRowStringForState(state, positions, endPunctuation = '.') {
        if (positions.length === 0) return '';
        if (positions.length === 1) return `Letter ${positions[0]} ${state}${endPunctuation} `;
        if (positions.length === 5) return `All letters ${state}. `;

        const lastPosition = positions.pop();
        return `Letters ${positions.join(', ')} and ${lastPosition} ${state}${endPunctuation} `;
    }

    function createAltText(gameApp) {
        const rows = gameApp.evaluations;
        const gameNumber = gameApp.dayOffset;
        const guesses = gameApp.rowIndex;
        const won = gameApp.gameStatus === 'WIN';

        let text = `Wordle ${gameNumber} result. `;
        text += won ? `Won in ${guesses} of 6 guesses. ` : `Lost after all 6 guesses. `;

        rows.forEach((row, index) => {
            if (row === null) return;
            text += `Guess ${index + 1}: `;

            const states = { correct: [], present: [], absent: [] };
            row.forEach((tileState, index) => {
                states[tileState].push(index + 1);
            });

            text += createRowStringForState('correct', states.correct, states.present.length > 0 ? ',' : '.');
            text += createRowStringForState('present', states.present);

            if (states.correct.length === 0 && states.present.length === 0) {
                text += createRowStringForState('absent', states.absent);
            }
        });

        return text;
    }

    function size(size) {
        return BASE_SIZE * size;
    }

    function createImageDataUrlFromGame(gameApp) {
        const rowEvaluations = gameApp.evaluations;
        const filledRows = rowEvaluations.filter(row => row != null);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const TEXT_HEIGHT = size(10);
        const TILE_COLOURS = { absent: '#d3d6da', present: '#c9b458', correct: '#6aaa64' };
        const TILES_PER_ROW = 5;
        const TILE_SIDE = size(20), TILE_GUTTER = size(2), PADDING = size(6);

        const CANVAS_Y_PADDING = size(15);
        const CONTENT_WIDTH = (TILE_SIDE * TILES_PER_ROW) + (TILE_GUTTER * TILES_PER_ROW - 1);
        const CONTENT_HEIGHT = TEXT_HEIGHT + PADDING + (TILE_SIDE * filledRows.length) + (TILE_GUTTER * filledRows.length - 1);
        const CANVAS_HEIGHT = CANVAS_Y_PADDING + CONTENT_HEIGHT + CANVAS_Y_PADDING;
        const CANVAS_WIDTH = CANVAS_HEIGHT / 9 * 16;
        const CONTENT_X_POS = (CANVAS_WIDTH - CONTENT_WIDTH) / 2;
        const CONTENT_Y_POS = CANVAS_Y_PADDING;
        const FIRST_ROW_Y_POS = CONTENT_Y_POS + TEXT_HEIGHT + PADDING;

        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'black';
        ctx.font = `${TEXT_HEIGHT}px 'Clear Sans', 'Helvetica Neue', Arial, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(createShareString(gameApp), CONTENT_X_POS, CONTENT_Y_POS, canvas.width);

        for (let i = 0; i < filledRows.length; i++) {
            const row = filledRows[i];
            const rowY = FIRST_ROW_Y_POS + (i * (TILE_SIDE + TILE_GUTTER));

            for (let j = 0; j < row.length; j++) {
                const tile = row[j];
                const tileX = CONTENT_X_POS + (j * (TILE_SIDE + TILE_GUTTER));
                ctx.fillStyle = TILE_COLOURS[tile] || TILE_COLOURS.absent;
                ctx.fillRect(tileX, rowY, TILE_SIDE, TILE_SIDE);
            }
        }

        return canvas.toDataURL();
    }

    function removeExistingModal() {
        const modal = document.querySelector('#wordle-image-generator-modal');
        const overlay = document.querySelector('#wordle-image-generator-overlay');

        if (modal) modal.remove();
        if (overlay) overlay.remove();
    }

    function displayScreenshotModal(imgData, altText) {
        removeExistingModal();

        const closeButton = document.createElement('button');
        closeButton.innerText = 'Close';
        closeButton.style = 'background: none; border: none; font-size: 0.8em; cursor: pointer; position: absolute; top: 0.25rem; right: 0.25rem; padding: 0.4rem 0.8rem;';

        const title = document.createElement('h2');
        title.innerText = 'Wordle image generator';
        title.style = 'margin-top: 0;';

        const introText = document.createElement('p');
        introText.innerText = 'A little tool for sharing your Wordle results in a more accessible way. Just copy or save the image and description below.';

        const image = document.createElement('img');
        image.src = imgData;
        image.alt = altText;
        image.style = 'max-width:100%;';

        const copyButton = document.createElement('button');
        copyButton.innerText = 'Copy alt text';
        copyButton.style = 'float:right;font-size: 1rem; padding: 0.5em 1em;';
        copyButton.addEventListener('click', () => navigator.clipboard.writeText(altText));

        const altTextBox = document.createElement('p');
        altTextBox.style = 'max-width: 100%; background: #f6f7f8; border-radius: 10px; padding: 1em;';
        altTextBox.innerText = altText;

        const modal = document.createElement('div');
        modal.id = 'wordle-image-generator-modal';
        modal.style = 'z-index:10000;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;width: 400px;max-width:80%;max-height:80%;background:white;padding:2rem;border:4px solid #d3d6da;border-radius: 30px;';
        modal.appendChild(closeButton);
        modal.appendChild(title);
        modal.appendChild(introText);
        modal.appendChild(image);
        modal.appendChild(altTextBox);
        modal.appendChild(copyButton);

        const overlay = document.createElement('div');
        overlay.id = 'wordle-image-generator-overlay';
        overlay.style = `z-index: 9999; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5);`;

        const hideModal = () => { modal.remove(); overlay.remove(); };
        overlay.addEventListener('click', hideModal);
        closeButton.addEventListener('click', hideModal);

        document.body.appendChild(overlay);
        document.body.appendChild(modal);
    }

    const gameApp = document.querySelector('game-app');
    if (gameApp) {
        try {
            const imgData = createImageDataUrlFromGame(gameApp);
            displayScreenshotModal(imgData, createAltText(gameApp));
        } catch (e) {
            alert('Something went wrong when generating the image! Perhaps Wordle has been updated and this bookmarklet is out of date?');
        }
    } else {
        console.warn('Wordle image generator could not find a Wordle game on this page.');
    }
})();
