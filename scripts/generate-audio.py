"""Generate the static US-English library. Requires tools in audio/README.md."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--model', required=True)
parser.add_argument('--voices', required=True)
args = parser.parse_args()
options = ort.SessionOptions()
options.intra_op_num_threads = 4
options.inter_op_num_threads = 1
session = ort.InferenceSession(args.model, sess_options=options, providers=['CPUExecutionProvider'])
engine = Kokoro.from_session(session, args.voices)
lessons = json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {lessons} from './src/data.js'; console.log(JSON.stringify(lessons))"],cwd=root))
output = root / 'audio'
output.mkdir(exist_ok=True)
manifest = {'engine':'Kokoro-82M v1.0','locale':'en-US','voices':{'You':'af_heart','Other':'am_michael'},'assets':{}}

def encode(samples, rate, name):
    assert len(samples) > rate * .3 and np.isfinite(samples).all()
    with tempfile.NamedTemporaryFile(suffix='.wav') as f:
        sf.write(f.name, samples, rate)
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',f.name,'-af','loudnorm=I=-18:TP=-2:LRA=9','-codec:a','libmp3lame','-b:a','96k',str(output/name)],check=True)
    return {'file':name,'duration':round(len(samples)/rate,3),'sha256':hashlib.sha256((output/name).read_bytes()).hexdigest()}

for lesson in lessons:
    turns = []
    for speaker, text in lesson['dialogue']:
        voice = 'af_heart' if speaker == 'You' else 'am_michael'
        samples, rate = engine.create(text,voice=voice,speed=1.0,lang='en-us',sentence_pause=.18,clause_pause=.08)
        turns.append(samples)
        turns.append(np.zeros(round(rate * .28),dtype=np.float32))
    dialogue = encode(np.concatenate(turns[:-1]),rate,lesson['id']+'-dialogue.mp3')
    samples,rate=engine.create(lesson['phrase'],voice='af_heart',speed=1.0,lang='en-us',sentence_pause=.18,clause_pause=.08)
    phrase=encode(samples,rate,lesson['id']+'-phrase.mp3')
    manifest['assets'][lesson['id']]={'dialogue':dialogue,'phrase':phrase,'source':{'dialogue':lesson['dialogue'],'phrase':lesson['phrase']}}
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(lesson['id'],'generated',flush=True)
print('Complete:',len(manifest['assets'])*2,'assets',flush=True)
