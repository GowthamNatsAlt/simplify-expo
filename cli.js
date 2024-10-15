#!/usr/bin/env node

const { Command } = require('commander');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const program = new Command();

const default_location = 'my-app';
const repo_url = 'https://github.com/GowthamNatsAlt/simplify-expo-cloner.git';

const cloneRepo = (location) => {
    const absolutePath = path.resolve(location);

    // Check if the directory exists and is empty
    if (fs.existsSync(absolutePath)) {
        const files = fs.readdirSync(absolutePath);
        if (files.length > 0) {
            console.error(`Error: The directory is not empty. Enter another location.`);
            process.exit(1);
        }
    }

    // Clone the repo
    console.log("\nInitializing the application...")
    const cloneCommand = `git clone ${repo_url} ${location}`;
    try {
        execSync(cloneCommand, { stdio: 'ignore' });
        console.log(`App initialized at the given location -> ${location}.`);
        console.log(`\nRun the following commands to start working on it:\n1. cd ${location}\n2. npm install\n\nHave fun!!!`);
        process.exit(0);
    } catch (error) {
        console.error('Error: ', error.message);
        process.exit(1);
    }
}

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
                cloneRepo(location);
            });
        } else {
            cloneRepo(location);
        }
    })

program.parse(process.argv)