#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const https = require('https');
const unzipper = require('unzipper');

const program = new Command();

const default_location = './';
const repo_zip_url = 'https://github.com/GowthamNatsAlt/simplify-expo-clone/archive/refs/heads/main.zip';

const downloadAndExtractRepo = (location) => {
    const absolutePath = path.resolve(location);

    // Check if the directory exists and is empty
    if (fs.existsSync(absolutePath)) {
        const files = fs.readdirSync(absolutePath);
        if (files.length > 0) {
            console.error(`Error: The directory is not empty. Enter another location.`);
            process.exit(1);
        }
    } else {
        fs.mkdirSync(absolutePath, { recursive: true });
    }

    console.log("\nInitializing the application...");
    const zipPath = path.join(absolutePath, 'repo.zip');

    // Function to extract the zip file after download completes
    const extractZip = () => {
        fs.createReadStream(zipPath)
            .pipe(unzipper.Parse())
            .on('entry', (entry) => {
                const fileName = entry.path.split('/').slice(1).join('/'); // Remove top-level folder
                const filePath = path.join(absolutePath, fileName);

                if (fileName) {
                    if (entry.type === 'Directory') {
                        fs.mkdirSync(filePath, { recursive: true });
                    } else {
                        entry.pipe(fs.createWriteStream(filePath));
                    }
                } else {
                    entry.autodrain();
                }
            })
            .on('close', () => {
                fs.unlinkSync(zipPath); // Delete the zip file after extraction
                console.log(`App initialized at the given location -> ${location}.`);
                console.log(`\nRun the following commands to start working on it:\n1. cd ${location}\n2. npm install\n\nHave fun!!!`);
                process.exit(0);
            })
            .on('error', (err) => {
                console.error('Extraction error: ', err.message);
                process.exit(1);
            });
    };

    // Recursive function to handle redirects and download the zip file
    const downloadFile = (url) => {
        const file = fs.createWriteStream(zipPath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log("Download complete.");
                    extractZip();
                });
            } else if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirection by following the `location` header
                const newUrl = response.headers.location;
                console.log(`Redirected to ${newUrl}`);
                downloadFile(newUrl);
            } else {
                console.error(`Download failed with status code ${response.statusCode}`);
                fs.unlinkSync(zipPath);
                process.exit(1);
            }
        }).on('error', (err) => {
            console.error('Download error: ', err.message);
            fs.unlinkSync(zipPath);
            process.exit(1);
        });
    };

    downloadFile(repo_zip_url);
};

program
    .name('Simplify Expo')
    .description('A simple CLI tool to create an expo project with tailwind and expo-router pre-initialized')
    .version('1.0.0');

program
    .command('create [location]')
    .description('Enter a location to initialize the application.')
    .action((location) => {
        if (!location) {
            process.stdout.write(`Enter the location (defaults to ${default_location}): `);
            process.stdin.on('data', (input) => {
                let input_location = input.toString().trim();
                if (input_location === "") {
                    location = default_location;
                } else {
                    location = input_location;
                }
                downloadAndExtractRepo(location);
            });
        } else {
            downloadAndExtractRepo(location);
        }
    });

program.parse(process.argv);
