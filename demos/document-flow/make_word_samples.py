#!/usr/bin/env python3
"""Offline demonstration: generate four synthetic Word documents. Requires python-docx.

No real customer data; no network, PandaDoc, signatures, or credentials.
"""
import argparse
import json
from pathlib import Path
import re
from docx import Document
from docx.shared import Pt, Inches

HERE=Path(__file__).resolve().parent
TOKEN=re.compile(r'\[([A-Za-z][A-Za-z0-9_.]*)\]')

def styled_document(title, lines):
    doc=Document()
    section=doc.sections[0]
    section.top_margin=Inches(.85)
    section.bottom_margin=Inches(.78)
    section.left_margin=Inches(.85)
    section.right_margin=Inches(.85)
    normal=doc.styles['Normal']
    normal.font.name='Aptos'
    normal.font.size=Pt(10)
    doc.add_heading(title,0)
    for line in lines:
        if not line.strip():continue
        if line.isupper() and len(line)<65 and not line.startswith('DEMONSTRATION'):
            doc.add_heading(line,level=2)
        else:
            doc.add_paragraph(line)
    return doc

def render(template, values):
    names=set(TOKEN.findall(template))
    if set(values)!=names or any(not isinstance(v,str) or not v.strip() or len(v)>400 for v in values.values()):
        raise ValueError('Missing, unexpected, empty or oversized mapping value.')
    return TOKEN.sub(lambda match:values[match.group(1)],template)

def generate(output_dir):
    output_dir=Path(output_dir)
    output_dir.mkdir(parents=True,exist_ok=True)
    template=(HERE/'template.txt').read_text(encoding='utf-8').strip()
    values=json.loads((HERE/'sample_values.json').read_text(encoding='utf-8'))
    previous=['FICTITIOUS EXISTING SERVICE TEMPLATE','PARTIES',
              'Evergreen Studio Co. will provide a website content audit to Northstar Labs LLC.',
              'PAYMENT','Payment due within 30 days of invoice receipt.',
              'PROGRESS','Status updates are provided upon request.',
              'DELIVERABLE REVIEW','No separately defined deliverable review in this sample.',
              'DEMONSTRATION ONLY — no client document was used.']
    changes=['SIMULATED WORD REVISION REQUEST','PAYMENT',
             'Replace 30 days with 15 days, subject to approval of agreed deliverables.',
             'PROGRESS','Add a weekly status update and a final handoff summary.',
             'DELIVERABLES','Specify a written audit, recommendations table and review meeting.',
             'VARIABLES','Use named fields for repeated names, dates and service values.',
             'DEMONSTRATION ONLY — fictional change request.']
    jobs=[
      ('01_Existing_Template_SIMULATED.docx','Original / Before',previous),
      ('02_Word_Updates_SIMULATED.docx','Word changes / Simulated',changes),
      ('03_Consolidated_Template_with_Variables.docx','Consolidated / Template',template.split('\n')),
      ('04_Populated_Sample_OFFLINE.docx','Populated / Offline sample',render(template,values).split('\n'))]
    for filename,title,lines in jobs:
        dest=output_dir/filename
        if dest.exists():raise FileExistsError(f'Refusing to overwrite: {dest}')
        styled_document(title,lines).save(dest)
    return [output_dir/name for name,_,_ in jobs]

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',default='generated')
    args=parser.parse_args()
    for filename in generate(args.out):print(filename)
