from lxml import html
import requests
import re
import os

for filename in os.listdir(os.getcwd()+'/originalHTML'):
    print(filename)
    f = open('./originalHTML/' + filename, "r")
    page = f.read()
    f.close()
    #page = requests.get('http://delivery.acm.org/10.1145/3310000/3300782/a552-brackenbury.html?ip=169.237.6.227&id=3300782&acc=OA&key=CA367851C7E3CE77%2EBD0EBCE24FE9A3C5%2E4D4702B0C3E38B35%2E1BEBFB956F94DAC2&__acm__=1575103444_84d2919e754bc063249b851bc702daf9')
    #print(page)
    tree = html.fromstring(page)

    abstract = tree.xpath('//p/small')
    #This will create a list of prices
    #prices = tree.xpath('//span[@class="item-price"]/text()')
    text = tree.xpath('//section/p')

    cleanText = re.sub(r"\s\[([0-9_\, ]+)\]", "", abstract[0].text_content()) + '\n'
    for p in text:
        cleanText += re.sub(r"\s\[([0-9_\, ]+)\]", "", p.text_content()) + '\n'
    #print(cleanText)

    f = open(filename[:-5] + ".txt", "w")
    f.write(cleanText)
    f.close()