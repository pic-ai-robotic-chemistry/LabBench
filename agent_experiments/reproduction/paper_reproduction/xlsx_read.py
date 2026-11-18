"""Read literal/cached XLSX cells with the standard library; never edit Excel."""
import posixpath
import re
from xml.etree import ElementTree as ET
from zipfile import ZipFile

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'


def column_index(reference):
    value = 0
    for char in re.match(r'[A-Z]+', reference).group():
        value = value * 26 + ord(char) - 64
    return value - 1


def sheets(path, selected):
    result = {}
    with ZipFile(path) as archive:
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared = [''.join(t.text or '' for t in item.findall('.//m:t', NS))
                      for item in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        rels = {x.attrib['Id']: x.attrib['Target'] for x in
                ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        workbook = ET.fromstring(archive.read('xl/workbook.xml'))
        for sheet in workbook.find('m:sheets', NS):
            name = sheet.attrib['name']
            if name not in selected:
                continue
            target = rels[sheet.attrib[REL]]
            target = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
            rows = []
            for row in ET.fromstring(archive.read(target)).findall('m:sheetData/m:row', NS):
                values = {}
                for cell in row:
                    value = cell.find('m:v', NS)
                    text = '' if value is None else value.text or ''
                    kind = cell.attrib.get('t')
                    if kind == 's':
                        text = shared[int(text)]
                    elif kind == 'inlineStr':
                        text = ''.join(t.text or '' for t in cell.findall('.//m:t', NS))
                    if cell.find('m:f', NS) is not None:
                        raise ValueError(f'Formula requires engine validation: {name}/{cell.attrib["r"]}')
                    values[column_index(cell.attrib['r'])] = text
                if values:
                    rows.append([values.get(i, '') for i in range(max(values) + 1)])
            header = rows[0]
            if len(set(header)) != len(header):
                raise ValueError(f'Duplicate headers: {name}')
            result[name] = [dict(zip(header, row + [''] * (len(header)-len(row)))) for row in rows[1:]]
    if set(result) != set(selected):
        raise ValueError('Missing requested sheets: ' + repr(set(selected)-set(result)))
    return result
