const express = require('express');

const cors = require('cors');

const fs = require('fs');

const path = require('path');

const { exec } = require('child_process');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());

app.post('/run', async (req, res) => {

    try {

        const { code, language, input } = req.body;

        const tempDir = path.join(__dirname, 'temp');

        if (!fs.existsSync(tempDir)) {

            fs.mkdirSync(tempDir);
        }

        let fileName = '';

        let command = '';

        // JavaScript
        if (language === 'javascript') {

            fileName = 'main.js';

            fs.writeFileSync(
                path.join(tempDir, fileName),
                code
            );

            command = `node ${path.join(tempDir, fileName)}`;
        }

        // Python
        else if (language === 'python') {

            fileName = 'main.py';

            fs.writeFileSync(
                path.join(tempDir, fileName),
                code
            );

            command = `python3 ${path.join(tempDir, fileName)}`;
        }

        // C
        else if (language === 'c') {

            fileName = 'main.c';

            fs.writeFileSync(
                path.join(tempDir, fileName),
                code
            );

            command =
                `gcc ${path.join(tempDir, fileName)} -o ${path.join(tempDir, 'main')} && ${path.join(tempDir, 'main')}`;
        }

        // C++
        else if (language === 'cpp') {

            fileName = 'main.cpp';

            fs.writeFileSync(
                path.join(tempDir, fileName),
                code
            );

            command =
                `g++ ${path.join(tempDir, fileName)} -o ${path.join(tempDir, 'main')} && ${path.join(tempDir, 'main')}`;
        }

        // Java
        else if (language === 'java') {

            fileName = 'Main.java';

            fs.writeFileSync(
                path.join(tempDir, fileName),
                code
            );

            command =
                `javac ${path.join(tempDir, fileName)} && java -cp ${tempDir} Main`;
        }

        const process = exec(

            command,

            {
                timeout: 5000
            },

            (error, stdout, stderr) => {

                if (error) {

                    return res.json({

                        output: stderr || error.message
                    });
                }

                res.json({

                    output: stdout
                });
            }
        );

        if (input) {

            process.stdin.write(input);

            process.stdin.end();
        }

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            output: 'Server Error'
        });
    }
});

app.listen(PORT, () => {

    console.log('Compiler Server Running');
});
