import Axios from 'axios';
import Fs from 'fs';
import Path from 'path';

const savePage = async (number) => {
    const path = Path.resolve(__dirname, '../cache', `page${number}.html`);
    const writer = Fs.createWriteStream(path);
    const url = 'https://daniels-orchestral.com/wp-content/plugins/om-advanced-search/om-ajax-search.php';

    console.log(`Fetching page ${number}`)

    const response = await Axios({
        url,
        method: 'POST',
        responseType: 'stream',
        data: "data%5B0%5D%5Bname%5D=fetchPageNumbers&data%5B0%5D%5Bvalue%5D=0&data%5B1%5D%5Bname%5D=noOfPage&data%5B1%5D%5Bvalue%5D=" + number,
        headers: {
            'cookie': 'COOKIE GOES HERE',
            'contentType': 'application/x-www-form-urlencoded; charset=UTF-8',
        }
    });

    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const fetch = async () => {
    console.log('Fetching');
    var pages = [];

    for (var i = 1; i <= 109; i++) {
        pages.push(i);
    }

    pages.reduce(function (promise, item) {
        return promise.then(function (result) {
            return Promise.all([delay(750), savePage(item)]);
        })
    }, Promise.resolve())
}

fetch();