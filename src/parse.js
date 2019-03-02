import { parse } from 'node-html-parser';
import moment from 'moment';
import Fs from 'fs';
import Path from 'path';

const readFile = (path, opts = 'utf8') =>
    new Promise((resolve, reject) => {
        Fs.readFile(path, opts, (err, data) => {
            if (err) reject(err)
            else resolve(data)
        })
    })

const writeFile = (path, data, opts = 'utf8') =>
    new Promise((resolve, reject) => {
        Fs.writeFile(path, data, opts, (err) => {
            if (err) reject(err)
            else resolve()
        })
    })

const after = (str, char) => str.substr(str.indexOf(char) + 1, str.length - str.indexOf(char)).trim();
const before = (str, char) => str.substr(0, str.indexOf(char)).trim();

const parsePage = async (number) => {
    const filePath = Path.resolve(__dirname, '../cache', `page${number}.html`);
    const html = await readFile(filePath);

    const root = parse(html);
    const contents = root.querySelector('#work-contents');

    const data = {
        composers: []
    };
    let currentComposer = null;

    contents.childNodes.forEach(row => {
        if (row.classNames && row.classNames.indexOf('newComposer') > -1) {
            if (currentComposer) {
                data.composers.push(currentComposer);
            }

            const name = row.childNodes[1].innerHTML.trim();
            const forename = after(name, ',');
            const surname = before(name, ',');
            const dates = row.childNodes[3].innerHTML.trim();
            const birthYear = before(dates, '-');
            const deathYear = after(dates, '-');

            currentComposer = {
                forename,
                surname,
                birthYear,
                deathYear: deathYear === '<span class=\"blank-year\">0000</span>' ? undefined : deathYear,
                works: []
            };
        }
        if (row.classNames && row.classNames.indexOf('newComposerDetails') > -1) {
            const details = row.innerHTML.trim();
            const nationality = after(details, '.');

            const birthDetails = details.match(/b ([a-zA-Z, ]*), (\d{1,2} \w{3} \d{4})/);
            const deathDetails = details.match(/d ([a-zA-Z, ]*), (\d{1,2} \w{3} \d{4})/);
            if (birthDetails) {
                currentComposer.born = {
                    location: birthDetails[1],
                    date: moment(birthDetails[2], 'DD MMMM YYYY').toJSON(),
                };
            }
            if (deathDetails) {
                currentComposer.died = {
                    location: deathDetails[1],
                    date: moment(deathDetails[2], 'DD MMMM YYYY').toJSON(),
                };
            }
            currentComposer.nationality = nationality;
        }
        if (row.classNames && row.classNames.indexOf('workBox') > -1) {

            const header = row.childNodes[1].childNodes[1].childNodes[0].innerHTML.trim();
            const title = before(header, '<');
            const dates = header.match(/<(.+)>/);
            const duration = parseInt(row.childNodes[1].childNodes[3].innerHTML.trim().replace('\'', ''));

            const orchestra = row.childNodes[3].childNodes[1].childNodes[1].innerHTML.trim().split('  ');
            const movements = row.querySelector('workMovement');

            const work = {
                title,
                dates: dates ? dates[1] : null,
                duration,
                movements: movements ? movements.innerHTML : null,
                orchestra
            }

            currentComposer.works.push(work);
        }
    });

    const outPath = Path.resolve(__dirname, '../output', `page${number}.json`);
    await writeFile(outPath, JSON.stringify(data, null, 4));
}

const parsePages = async () => {
    console.log('Parsing');
    await parsePage(1);
}


parsePages();