const express = require('express');

const cors = require('cors');

const fs = require('fs');

const path = require('path');

const { exec, spawn } = require('child_process');

const { v4: uuidv4 } = require('uuid');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());


// ========================================
// Home Route
// ========================================

app.get('/', (req, res) => {

    res.send('Compiler API Running');
});


// ========================================
// Run Code Route
// ========================================

app.post('/run', async (req, res) => {

    try {

        const { code, language, input } = req.body;

        const tempDir = path.join(__dirname, 'temp');

        // Create temp folder
        if (!fs.existsSync(tempDir)) {

            fs.mkdirSync(tempDir);
        }

        // Unique ID
        const id = uuidv4();

        let fileName = '';

        let filePath = '';

        let command = '';

        let outputFile = '';

        let javaDir = '';



        // ========================================
        // JavaScript
        // ========================================

        if (language === 'javascript') {

            fileName = `${id}.js`;

            filePath = path.join(tempDir, fileName);

            fs.writeFileSync(filePath, code);

            command = `node "${filePath}"`;
        }



        // ========================================
        // Python
        // ========================================

        else if (language === 'python') {

            fileName = `${id}.py`;

            filePath = path.join(tempDir, fileName);

            fs.writeFileSync(filePath, code);

            command = `python3 "${filePath}"`;
        }



        // ========================================
        // C
        // ========================================

        else if (language === 'c') {

            fileName = `${id}.c`;

            filePath = path.join(tempDir, fileName);

            outputFile =
                path.join(tempDir, `${id}.out`);

            fs.writeFileSync(filePath, code);

            command =
                `gcc "${filePath}" -o "${outputFile}" && "${outputFile}"`;
        }



        // ========================================
        // C++
        // ========================================

        else if (language === 'cpp') {

            fileName = `${id}.cpp`;

            filePath = path.join(tempDir, fileName);

            outputFile =
                path.join(tempDir, `${id}.out`);

            fs.writeFileSync(filePath, code);

            command =
                `g++ "${filePath}" -o "${outputFile}" && "${outputFile}"`;
        }



        // ========================================
        // Java
        // ========================================

        else if (language === 'java') {

            // Unique folder for Java
            javaDir =
                path.join(tempDir, id);

            // Create folder
            if (!fs.existsSync(javaDir)) {

                fs.mkdirSync(javaDir);
            }

            fileName = 'Main.java';

            filePath =
                path.join(javaDir, fileName);

            fs.writeFileSync(filePath, code);

            // ========================================
            // Compile Java
            // ========================================

            const compileProcess = spawn(

                'javac',

                ['Main.java'],

                {
                    cwd: javaDir
                }
            );

            let compileStdout = '';

            let compileStderr = '';



            compileProcess.stdout.on(

                'data',

                (data) => {

                    compileStdout +=
                        data.toString();
                }
            );



            compileProcess.stderr.on(

                'data',

                (data) => {

                    compileStderr +=
                        data.toString();
                }
            );



            compileProcess.on(

                'close',

                (compileCode) => {

                    // Compilation Failed
                    if (compileCode !== 0) {

                        // Delete Java Folder
                        if (
                            fs.existsSync(javaDir)
                        ) {

                            fs.rmSync(

                                javaDir,

                                {
                                    recursive: true,

                                    force: true
                                }
                            );
                        }

                        return res.json({

                            success: false,

                            output:
                                compileStderr ||
                                compileStdout ||
                                'Compilation Error'
                        });
                    }



                    // ========================================
                    // Run Java Program
                    // ========================================

                    const runProcess = spawn(

                        'java',

                        ['Main'],

                        {
                            cwd: javaDir
                        }
                    );

                    let runStdout = '';

                    let runStderr = '';



                    runProcess.stdout.on(

                        'data',

                        (data) => {

                            runStdout +=
                                data.toString();
                        }
                    );



                    runProcess.stderr.on(

                        'data',

                        (data) => {

                            runStderr +=
                                data.toString();
                        }
                    );



                    // User Input
                    if (input) {

                        runProcess.stdin.write(
                            input
                        );

                        runProcess.stdin.end();
                    }



                    // ========================================
                    // Java Execution Complete
                    // ========================================

                    runProcess.on(

                        'close',

                        () => {

                            // Delete Java Folder
                            if (
                                fs.existsSync(javaDir)
                            ) {

                                fs.rmSync(

                                    javaDir,

                                    {
                                        recursive: true,

                                        force: true
                                    }
                                );
                            }

                            // Runtime Error
                            if (runStderr) {

                                return res.json({

                                    success: false,

                                    output: runStderr
                                });
                            }

                            // Success
                            return res.json({

                                success: true,

                                output: runStdout
                            });
                        }
                    );



                    // Java Runtime Error
                    runProcess.on(

                        'error',

                        (err) => {

                            // Delete Java Folder
                            if (
                                fs.existsSync(javaDir)
                            ) {

                                fs.rmSync(

                                    javaDir,

                                    {
                                        recursive: true,

                                        force: true
                                    }
                                );
                            }

                            return res.json({

                                success: false,

                                output:
                                    err.message ||
                                    'Execution Error'
                            });
                        }
                    );
                }
            );



            // Java Compile Error
            compileProcess.on(

                'error',

                (err) => {

                    // Delete Java Folder
                    if (
                        fs.existsSync(javaDir)
                    ) {

                        fs.rmSync(

                            javaDir,

                            {
                                recursive: true,

                                force: true
                            }
                        );
                    }

                    return res.json({

                        success: false,

                        output:
                            err.message ||
                            'Compilation Error'
                    });
                }
            );



            return;
        }



        // ========================================
        // Invalid Language
        // ========================================

        else {

            return res.status(400).json({

                success: false,

                output: 'Unsupported Language'
            });
        }



        // ========================================
        // Execute JS/Python/C/C++
        // ========================================

        const process = exec(

            command,

            {
                timeout: 5000
            },

            (error, stdout, stderr) => {

                // Delete source file
                if (
                    filePath &&
                    fs.existsSync(filePath)
                ) {

                    fs.unlinkSync(filePath);
                }

                // Delete C/C++ executable
                if (
                    outputFile &&
                    fs.existsSync(outputFile)
                ) {

                    fs.unlinkSync(outputFile);
                }



                // Error Handling
                if (error) {

                    return res.json({

                        success: false,

                        output:
                            stderr ||
                            error.message ||
                            "Execution Error"
                    });
                }



                // Success Output
                res.json({

                    success: true,

                    output: stdout || stderr
                });
            }
        );



        // ========================================
        // User Input
        // ========================================

        if (input) {

            process.stdin.write(input);

            process.stdin.end();
        }

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            output: 'Server Error'
        });
    }
});



// ========================================
// Java Test Route
// ========================================

app.get('/java-test', (req, res) => {

    exec('java -version', (error, stdout, stderr) => {

        if (error) {

            return res.send(error.message);
        }

        res.send(stderr || stdout);
    });
});



// ========================================
// Start Server
// ========================================

app.listen(PORT, () => {

    console.log(`Compiler Server Running on Port ${PORT}`);
});
