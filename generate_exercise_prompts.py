"""Genera exercise-prompts.md: un prompt anatómico listo para pegar en
Nano Banana Pro por cada ejercicio, con su nombre de archivo destino.

Reusa la MISMA fuente y orden que generate_seed.py (create_exercises.py),
así los NNN del prompt coinciden con los image_url del seed.

Uso:  python generate_exercise_prompts.py
"""

import re
import sys
import io

from exercise_slug import slugify, image_filename, IMG_EXT

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# ── Parseo de create_exercises.py (idéntico a generate_seed.py) ────────────────
with open("create_exercises.py", encoding="utf-8") as f:
    src = f.read()

m = re.search(r"exercises\s*=\s*\[(.*?)\n\]", src, re.DOTALL)
if not m:
    sys.exit("No se encontró el array exercises en create_exercises.py")

exercises = []
for line in m.group(1).splitlines():
    line = line.strip()
    if not line.startswith("["):
        continue
    inner = line.lstrip("[").rstrip("],").rstrip("]")
    parts, current, in_quote = [], "", False
    for ch in inner:
        if ch == '"':
            in_quote = not in_quote
        elif ch == "," and not in_quote:
            parts.append(current.strip().strip('"'))
            current = ""
            continue
        current += ch
    if current.strip():
        parts.append(current.strip().strip('"'))
    if len(parts) >= 7:
        exercises.append(parts)

# ── Detección de colisiones de slug ───────────────────────────────────────────
seen = {}
collisions = []
for ex in exercises:
    s = slugify(ex[0])
    if s in seen:
        collisions.append((s, seen[s], ex[0]))
    else:
        seen[s] = ex[0]
if collisions:
    print("⚠ COLISIONES DE SLUG (el prefijo NNN las desambigua, pero revísalas):")
    for s, a, b in collisions:
        print(f"  {s}: '{a}'  vs  '{b}'")
    print()

# ── Mapa músculo ES → término anatómico (en inglés, para precisión) ───────────
# Los no mapeados caen al término en español tal cual.
ANATOMICAL = {
    "Pecho": "pectoralis major",
    "Espalda Alta": "rhomboids and middle trapezius",
    "Espalda Baja": "erector spinae (lower back)",
    "Dorsal": "latissimus dorsi",
    "Trapecios": "trapezius",
    "Hombros": "deltoids",
    "Hombros (anterior)": "anterior deltoid",
    "Hombros (lateral)": "lateral deltoid",
    "Hombros (posterior)": "posterior deltoid",
    "Manguito Rotador": "rotator cuff",
    "Biceps": "biceps brachii",
    "Triceps": "triceps brachii",
    "Braquiorradial": "brachioradialis",
    "Flexores del Antebrazo": "forearm flexors",
    "Extensores del Antebrazo": "forearm extensors",
    "Antebrazo": "forearm muscles",
    "Cuadriceps": "quadriceps",
    "Isquiotibiales": "hamstrings",
    "Gluteos": "gluteus maximus",
    "Gluteos (medio)": "gluteus medius",
    "Aductores": "hip adductors",
    "Gastrocnemio": "gastrocnemius",
    "Soleo": "soleus",
    "Core": "core (abdominals)",
    "Recto Abdominal": "rectus abdominis",
    "Recto Abdominal (inferior)": "lower rectus abdominis",
    "Oblicuos": "obliques",
    "TFL": "tensor fasciae latae",
    "Variable": "the primary working muscle",
}


def anat(muscle: str) -> str:
    return ANATOMICAL.get(muscle.strip(), muscle.strip())


def anat_list(csv: str) -> str:
    items = [anat(x) for x in csv.split(",") if x.strip()]
    return ", ".join(items)


# ── Postura / cómo se ve el ejercicio ─────────────────────────────────────────
# Reglas (subcadena_en_nombre_sin_acentos -> descripción explícita de la posición
# corporal y el movimiento). Se evalúan EN ORDEN; gana la primera que coincide,
# así que van de lo más específico a lo más general.
POSTURE_RULES = [
    # ── Tirón / espalda ──
    ("muscle-up", "hanging from an overhead bar, explosively pulling up and transitioning over the bar to a support position"),
    ("dominadas", "hanging from a fixed overhead pull-up bar with arms fully extended, then pulling the whole body up until the chin clears the bar"),
    ("pull-up", "hanging from a fixed overhead bar with arms fully extended, pulling the body up until the chin clears the bar"),
    ("chin-up", "hanging from a fixed overhead bar with an underhand grip, pulling the body up until the chin clears the bar"),
    ("active hang", "hanging from an overhead bar with straight arms, depressing the shoulder blades"),
    ("dead hang", "hanging passively from an overhead bar with fully straight arms, the entire body suspended and relaxed"),
    ("remo invertido", "body straight and rigid in a horizontal inverted-row position underneath a fixed low bar, pulling the chest up toward the bar"),
    ("trx row", "leaning back holding TRX suspension straps, body straight at an angle, pulling the chest up toward the hands"),
    ("jalon", "seated at a lat-pulldown machine, gripping the wide overhead bar and pulling it down to the upper chest while the torso stays upright"),
    ("straight arm pulldown", "standing at a high cable with straight arms, pulling the bar down in an arc to the thighs"),
    ("pullover", "lying back on a bench, arms nearly straight, moving the weight in an arc from behind the head to above the chest"),
    ("face pull", "standing facing a high cable/band, pulling the rope toward the face with the elbows flared high and wide"),
    ("pull-apart", "standing upright holding a band with both hands out in front, stretching it apart across the chest by squeezing the shoulder blades"),
    ("encogimientos", "standing tall holding the weight at arm's length by the sides, shrugging the shoulders straight up toward the ears"),
    ("shrug", "standing tall holding the weight at arm's length, shrugging the shoulders straight up"),
    ("remo al menton", "standing, pulling the bar/weight vertically up the front of the body to chin height with the elbows leading high"),
    ("seal row", "lying face-down (prone) on an elevated bench, rowing the weight straight up to the bench"),
    ("remo", "torso bent forward at the hips with a flat back, pulling the weight up toward the lower ribcage with the elbows close"),
    ("row", "torso bent forward with a flat back, pulling the weight toward the lower ribcage"),
    # ── Empuje horizontal / pecho ──
    ("flexiones", "in a push-up position with hands on the floor and body held in a straight rigid plank, lowering the chest to the floor and pushing back up"),
    ("push-up", "in a straight-body push-up position, hands on the floor, lowering the chest and pressing the body back up"),
    ("push up", "in a straight-body push-up position, hands on the floor, lowering the chest and pressing the body back up"),
    ("diamond push", "push-up position with the hands close together forming a diamond under the chest"),
    ("handstand push", "inverted in a handstand against a wall, bending the arms to lower the head toward the floor and pressing back up"),
    ("pike push", "in a pike position (hips high, body inverted V), bending the arms to lower the head toward the floor"),
    ("fondos", "supporting the whole bodyweight on parallel bars with straight arms, bending the elbows to lower the body then pressing back up"),
    ("dips", "supporting the bodyweight on bars/bench, lowering by bending the elbows then pushing back up to straight arms"),
    ("aperturas", "lying on a bench, arms slightly bent in a wide arc, bringing the weights together above the chest"),
    ("apertura", "wide arc movement bringing the arms/handles together in front of the chest, elbows slightly bent"),
    ("pec deck", "seated at the pec-deck machine, bringing the arm pads together in front of the chest"),
    ("chest fly", "arms in a wide arc bringing the handles together in front of the chest"),
    ("cruce de poleas", "standing between two cable pulleys, bringing both handles together in front of the chest in a wide arc"),
    ("crossover", "standing between two cable pulleys, sweeping both handles together in front of the chest"),
    ("svend press", "standing, pressing a weight plate squeezed between both palms straight out in front of the chest"),
    ("floor press", "lying flat on the floor (back and upper arms on the ground), pressing the weight straight up from the chest"),
    ("press de banca", "lying supine on a bench, gripping the bar/weights at chest level and pressing them straight up to full arm extension"),
    ("bench press", "lying supine on a bench, pressing the weight straight up from the chest to full extension"),
    # ── Empuje vertical / hombros ──
    ("press arnold", "seated, pressing dumbbells overhead while rotating the palms from facing the body to facing forward"),
    ("press militar", "standing tall, pressing the barbell from the front of the shoulders straight up overhead to full lockout"),
    ("press de hombros", "pressing the weights from shoulder level straight up overhead to full lockout"),
    ("push press", "standing, using a slight leg dip to drive the barbell from the shoulders explosively overhead"),
    ("push jerk", "standing, dipping and driving the barbell overhead while re-bending the knees to catch it locked out"),
    ("split jerk", "driving the barbell overhead and catching it locked out in a split-leg stance"),
    ("press vertical", "pressing the handle from shoulder level straight up overhead"),
    ("press cubano", "rotating the dumbbells up from the elbows and then pressing them overhead"),
    ("elevaciones laterales", "standing upright, raising the arms straight out to both sides up to shoulder height"),
    ("elevaciones frontales", "standing upright, raising the arms straight forward up to shoulder height"),
    ("elevaciones posteriores", "bent forward at the hips, raising the arms out to the sides squeezing the rear shoulders"),
    ("pajaro", "bent forward at the hips, raising both arms out wide to the sides for the rear deltoids"),
    ("reverse pec deck", "seated facing the pec-deck machine, sweeping the arms backward out to the sides for the rear deltoids"),
    ("rotacion externa", "elbow bent 90 degrees and tucked to the side, rotating the forearm outward against resistance"),
    ("rotacion interna", "elbow bent 90 degrees and tucked to the side, rotating the forearm inward across the body"),
    ("w's", "lying prone, raising the arms into a 'W' shape squeezing the upper back and rear shoulders"),
    # ── Bíceps ──
    ("curl de muneca", "forearm resting along the thigh or bench, flexing only the wrist to curl the weight up"),
    ("wrist curl", "forearm supported, curling only at the wrist"),
    ("curl zottman", "standing curl that rotates the wrists at the top, lowering with an overhand grip"),
    ("curl martillo", "standing, curling dumbbells with a neutral (hammer) grip, palms facing each other"),
    ("curl", "curling the weight from arm's length up toward the shoulder by flexing the elbow, with the upper arm kept stationary"),
    # ── Tríceps ──
    ("press frances", "lying on a bench, lowering the weight toward the forehead by bending only the elbows, then extending the arms"),
    ("skullcrusher", "lying on a bench, lowering the bar toward the forehead by bending the elbows then extending"),
    ("jm press", "lying on a bench, lowering the bar toward the upper neck with tucked elbows then pressing up"),
    ("patada", "torso bent forward, upper arm fixed parallel to the body, extending the elbow to straighten the arm backward"),
    ("kickback", "torso bent forward, upper arm fixed, extending the elbow to straighten the arm backward"),
    ("pushdown", "standing at a high cable, upper arms pinned to the sides, pushing the bar/rope down by extending the elbows"),
    ("extension de triceps sobre", "extending the weight from behind the head up overhead by straightening the elbows, upper arms vertical"),
    ("extension de triceps", "straightening the elbows against resistance to extend the arms, upper arms kept fixed"),
    ("extension triceps", "straightening the elbows against resistance, upper arms fixed"),
    # ── Piernas ──
    ("prensa", "reclined in a leg-press machine, pushing the foot platform away by extending the knees and hips"),
    ("leg press", "reclined in a leg-press machine, pushing the platform away by extending the knees"),
    ("hack squat", "shoulders and back against the angled hack-squat machine pad, bending the knees to lower then pressing up"),
    ("pendulum squat", "braced in the pendulum-squat machine, bending the knees to lower along the arc then standing up"),
    ("belt squat", "standing with a weight belt around the hips, squatting down and standing up with the torso upright"),
    ("sissy squat", "standing, leaning the torso back and bending the knees forward to lower, keeping the hips and knees in line"),
    ("goblet", "standing holding a single weight at the chest, squatting straight down between the knees and standing up"),
    ("sentadilla", "standing with the weight, bending the hips and knees to lower into a deep squat, then driving back up to standing"),
    ("squat", "standing, bending the hips and knees to lower into a squat then standing back up"),
    ("zancada", "in a long split stance, lowering the back knee toward the floor by bending the front leg, then rising"),
    ("zancadas", "in a split stance lunge, lowering until the front thigh is parallel then driving back up"),
    ("lunge", "in a split-stance lunge, lowering the back knee then driving back up"),
    ("lateral squat", "in a wide stance, shifting the bodyweight over one bent leg while the other stays straight"),
    ("zancada lateral", "in a wide stance, shifting over one bent leg while the other stays straight"),
    ("step-up", "stepping up onto a raised box/bench, driving through the lead leg to stand on top"),
    ("extension de cuadriceps", "seated in a leg-extension machine, straightening the knees to raise the padded lever"),
    ("extension unilateral en maquina", "seated leg-extension machine, straightening one knee to raise the pad"),
    ("maquina de extension de cuadriceps", "seated in a leg-extension machine, straightening the knees against the pad"),
    ("curl de piernas tumbado", "lying face-down on a leg-curl machine, flexing the knees to curl the pad toward the glutes"),
    ("curl de piernas sentado", "seated in a leg-curl machine, flexing the knees to push the pad down and back"),
    ("curl de piernas", "on a leg-curl machine, flexing the knees to curl the pad toward the glutes"),
    ("curl de isquios", "flexing the knees to curl the resistance toward the glutes"),
    ("biceps femoral", "on a hamstring-curl machine, flexing the knees to curl the pad toward the glutes"),
    ("nordic curl", "kneeling with the ankles anchored, lowering the straight torso toward the floor by resisting with the hamstrings"),
    ("glute-ham raise", "knees anchored on a GHD pad, lowering the torso and curling back up using the hamstrings"),
    # ── Glúteos / cadena posterior ──
    ("hip thrust", "upper back resting on a bench, weight across the hips, driving the hips up to full extension squeezing the glutes"),
    ("puente de gluteos", "lying on the back with knees bent, lifting the hips up by squeezing the glutes into a bridge"),
    ("frog pump", "lying on the back with the soles of the feet together and knees out, pumping the hips upward"),
    ("donkey kick", "on hands and knees, kicking one leg up and back with a bent knee"),
    ("fire hydrant", "on hands and knees, lifting one bent leg out to the side"),
    ("cable kickback", "standing at a low cable with an ankle strap, kicking one straight leg backward"),
    ("clamshell", "lying on the side with knees bent and stacked, opening the top knee upward like a clamshell"),
    ("monster walk", "in a half-squat with a band around the legs, taking lateral steps keeping tension on the band"),
    ("abduccion", "seated hip-abduction machine, pushing both thighs outward against the pads"),
    ("aduccion", "seated hip-adduction machine, squeezing both thighs inward against the pads"),
    ("extension de cadera", "extending the hip backward against resistance, squeezing the glute"),
    # ── Espalda baja / hinge ──
    ("good morning", "barbell across the upper back, hinging forward at the hips with a flat back, then standing tall"),
    ("buenos dias", "barbell across the upper back, hinging the torso forward with a flat back, then returning upright"),
    ("hiperextension", "prone on a hyperextension bench, lowering the torso down then extending the back up to horizontal"),
    ("hiperextensiones", "prone on a hyperextension bench, lowering then raising the torso to horizontal"),
    ("reverse hyper", "torso supported face-down, swinging the straight legs up behind to extend the hips"),
    ("back extension", "prone on a back-extension bench, raising the torso to horizontal"),
    ("extension de espalda", "prone, extending the torso/back upward to horizontal"),
    ("superman", "lying face-down on the floor, simultaneously lifting the arms, chest and legs off the ground"),
    ("peso muerto rumano", "standing, hinging at the hips with a flat back to lower the bar down the thighs to mid-shin, then standing up"),
    ("peso muerto piernas rigidas", "standing with near-straight legs, hinging at the hips to lower the bar down the legs, then standing"),
    ("peso muerto sumo", "wide stance with toes out, gripping the bar inside the legs and standing it up from the floor"),
    ("peso muerto", "hip-hinge deadlift: flat back, gripping the barbell on the floor and standing fully upright by extending the hips and knees"),
    ("deadlift", "hip-hinge deadlift: flat back, lifting the barbell from the floor to standing"),
    ("sumo deadlift", "wide sumo stance, lifting the weight from the floor between the legs to standing"),
    # ── Gemelos ──
    ("elevacion de talones sentado", "seated with the weight on the knees, raising the heels by pushing through the balls of the feet"),
    ("elevacion de talones", "standing, rising up onto the balls of the feet by extending the ankles, then lowering"),
    ("pantorrillas sentado", "seated calf-raise machine, raising the heels by pushing through the toes"),
    ("pantorrillas de pie", "standing calf-raise machine, rising onto the balls of the feet"),
    ("saltos de pantorrilla", "standing, repeatedly hopping off the balls of the feet using the calves"),
    # ── Core ──
    ("plancha lateral", "side plank: balancing on one forearm and the side of the feet, body straight and rigid"),
    ("plancha", "front forearm plank: balancing on the forearms and toes with the body held perfectly straight and rigid"),
    ("plank", "forearm plank, body straight and rigid from head to heels"),
    ("crunch", "lying on the back with knees bent, curling the upper torso up toward the knees"),
    ("elevacion de piernas colgando", "hanging from an overhead bar, raising the straight legs up to horizontal by flexing the hips"),
    ("elevacion de rodillas colgando", "hanging from an overhead bar, raising the bent knees up toward the chest"),
    ("elevacion de piernas", "lying on the back, raising the straight legs up toward vertical then lowering with control"),
    ("hanging leg raise", "hanging from a bar, raising the straight legs to horizontal"),
    ("russian twist", "seated, leaning the torso back with feet off the floor, rotating the torso side to side"),
    ("ab wheel", "kneeling, rolling an ab-wheel forward to extend the body flat then pulling back"),
    ("rollout", "kneeling, rolling the bar/wheel forward to extend the body then back"),
    ("mountain climber", "in a push-up plank position, alternately driving the knees toward the chest"),
    ("pallof", "standing side-on to a cable/band, pressing the handle straight out from the chest and resisting the rotational pull"),
    ("dead bug", "lying on the back, extending opposite arm and leg while keeping the lower back flat"),
    ("deadbug", "lying on the back, extending opposite arm and leg while bracing the core"),
    ("bird dog", "on hands and knees, extending the opposite arm and leg straight out and holding"),
    ("hollow body", "lying on the back, lifting the shoulders and straight legs to hold a banana-shaped hollow position"),
    ("l-sit", "supporting the body on the hands with the straight legs held out horizontally"),
    ("dragon flag", "lying on a bench gripping behind the head, raising the whole straight body vertical then lowering it slowly"),
    ("tijeras", "lying on the back, alternately crossing the straight legs up and down like scissors"),
    ("stir the pot", "in a plank on a stability ball, drawing small circles with the forearms"),
    ("flexion lateral", "standing, bending the torso sideways toward the hip against a weight"),
    ("rotacion de tronco", "standing/seated, rotating the torso horizontally against the cable resistance"),
    ("cat-cow", "on hands and knees, alternately arching and rounding the spine"),
    # ── Acarreos / grip ──
    ("farmer walk", "standing tall and walking forward while carrying a heavy weight in each hand at the sides"),
    ("suitcase carry", "walking while carrying a heavy weight in one hand at the side, resisting the lean"),
    ("overhead carry", "walking while holding the weight locked out overhead"),
    ("plate pinch", "standing, pinch-gripping weight plates between the fingers and thumb while holding or walking"),
    ("wrist roller", "standing with arms out, rolling a weight up on a cord using only the wrists"),
    ("extension de muneca", "forearm supported, extending the wrist to raise the weight"),
    # ── Kettlebell / olímpicos ──
    ("turkish get-up", "rising from lying on the floor up to standing while holding a kettlebell locked out overhead"),
    ("swing", "hip-hinge kettlebell swing, swinging the kettlebell from between the legs up to chest/eye height with the hips"),
    ("halo", "standing, circling a kettlebell around the head close to the skull"),
    ("around the world", "standing, circling the weight around the body at waist height"),
    ("renegade row", "in a push-up position gripping two kettlebells, rowing one up to the ribs while balancing"),
    ("clean and jerk", "explosively pulling the barbell from the floor to the shoulders, then driving it overhead"),
    ("power clean", "explosively pulling the barbell from the floor up to the front of the shoulders"),
    ("hang clean", "explosively pulling the barbell from the hips up to the shoulders"),
    ("clean", "explosively pulling the weight from the floor/hips up to rack at the front of the shoulders"),
    ("snatch", "explosively pulling the weight from the floor/hips straight up to locked out overhead in one motion"),
    ("high pull", "explosively pulling the barbell up the body to chest height with high elbows"),
    ("jammer", "standing, pressing the angled bar up and forward explosively"),
    ("landmine squat to press", "holding a landmine bar at the chest, squatting then standing and pressing the bar up and forward"),
    # ── Cardio / máquinas ──
    ("rower", "seated on a rowing machine, driving with the legs and pulling the handle to the lower chest"),
    ("skierg", "standing at a ski-erg, pulling both handles down from overhead to the hips"),
    ("esqui", "standing at a ski-erg machine, pulling the handles down from overhead"),
    ("versaclimber", "on a vertical climber, alternately driving the arms and legs in a climbing motion"),
    ("escalada", "on a vertical climbing machine, alternating the arms and legs"),
    ("battle rope", "standing in a half-squat, whipping two heavy ropes up and down"),
    ("airbike", "seated on an air bike, pushing and pulling the handles while pedaling"),
    ("bicicleta", "seated on an air bike, driving the arms and legs"),
    # ── Catch-all de baja prioridad (solo si nada anterior coincidió) ──
    ("press guillotina", "lying supine on a flat bench, lowering the bar toward the neck then pressing it straight up"),
    ("bradford press", "standing/seated, pressing the barbell overhead and passing it from the front of the head to behind it and back"),
    ("convergente de pecho", "seated at a chest-press machine, pushing the handles forward and together away from the chest"),
    ("press en maquina pecho", "seated at a chest-press machine, pushing the handles straight forward away from the chest"),
    ("hammer strength press", "seated at a plate-loaded chest-press machine, pushing the handles forward away from the chest"),
    ("press en maquina smith", "lying supine on a bench under a Smith machine, pressing the guided bar straight up from the chest"),
    ("press con cable", "standing, pressing both cable handles forward away from the chest to full extension"),
    ("press inclinado", "lying back on an incline bench, pressing the weights up and slightly inward from the upper chest"),
    ("press declinado", "lying back on a decline bench, pressing the weights straight up from the lower chest"),
    ("press con barra landmine", "standing or half-kneeling, pressing the end of a landmine barbell up and forward from the shoulder"),
    ("press con kettlebell", "standing, pressing a kettlebell from the front rack position straight up overhead"),
    ("maquina de hombros", "seated at a shoulder machine, pressing/raising the arms to work the deltoids"),
    ("windmill", "standing with a kettlebell locked out overhead, hinging sideways at the hip to reach the opposite hand toward the floor while keeping the arm vertical"),
    ("hip abduction", "pushing the leg outward to the side against band resistance while standing"),
    ("abduction", "pushing the thighs/leg outward to the side against resistance"),
    ("triceps dip", "on an assisted-dip machine, lowering and pressing the body back up by extending the elbows"),
    ("trx pike", "in a plank with the feet in TRX straps, piking the hips up toward the ceiling"),
    ("pike", "in a pike position with the hips high and body in an inverted V"),
    ("maquina smith", "performing a guided barbell compound lift on a Smith machine"),
]


def _norm(s: str) -> str:
    import unicodedata
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower()


def posture(name: str) -> str | None:
    n = _norm(name)
    for kw, desc in POSTURE_RULES:
        if kw in n:
            return desc
    return None


def modifiers(name: str) -> str:
    n = _norm(name)
    mods = []
    if "inclinad" in n:
        mods.append("on an incline bench")
    if "declinad" in n:
        mods.append("on a decline bench")
    if "sentado" in n or "sentada" in n or "seated" in n:  # no confundir con "sentadilla"
        mods.append("in a seated position")
    elif "de pie" in n or "standing" in n:
        mods.append("standing")
    if "tumbad" in n or "acostad" in n or "lying" in n:
        mods.append("lying down")
    if any(k in n for k in ("unilateral", "un brazo", "una pierna", "un solo", "alternad")):
        mods.append("performed one side at a time")
    return ", ".join(mods)


# ── Bloque de estilo maestro ──────────────────────────────────────────────────
def build_prompt(ex) -> str:
    name, primary, secondary, equipment, movement = ex[0], ex[1], ex[2], ex[3], ex[4]
    instr = ex[6].strip() if len(ex) > 6 and ex[6].strip() else ""

    pose = posture(name)
    mods = modifiers(name)
    if pose:
        action = f"The figure is {pose}"
        if mods:
            action += f" ({mods})"
        action += "."
    else:
        # Sin regla específica: apóyate en el tipo de movimiento + instrucciones.
        action = (
            f"The figure is performing the movement clearly and recognizably "
            f"(movement type: {movement})."
        )
        if mods:
            action = action[:-1] + f", {mods}."

    sec = anat_list(secondary)
    sec_clause = (
        f" The {sec} glow softer orange as secondary muscles." if sec else ""
    )
    technique = f" Technique reference (Spanish): {instr}" if instr else ""

    return (
        f"Anatomical educational illustration of one human figure correctly performing "
        f"the strength exercise \"{name}\" using {equipment}. "
        f"{action} The full body is visible with anatomically correct, biomechanically "
        f"realistic posture, instantly recognizable as this specific exercise, the "
        f"equipment ({equipment}) positioned and gripped exactly as the movement requires."
        f"{technique} "
        f"Render the body as a clean, semi-transparent grey anatomical model with visible "
        f"musculature: the {anat(primary)} glows crimson red as the primary working "
        f"muscle;{sec_clause} all other muscles stay neutral grey. The {equipment} is dark "
        f"matte grey. Three-quarter side view, full figure centered and fully inside the "
        f"frame, plain solid dark background (#0f0f1a), soft even studio lighting, square "
        f"1:1. No text, no labels, no arrows, no watermark. Flat, clean medical-illustration "
        f"style, identical across the whole set."
    )


# ── Salida markdown ───────────────────────────────────────────────────────────
total = len(exercises)
out = [
    "# Prompts de imágenes de ejercicios — Nano Banana Pro",
    "",
    f"**{total} ejercicios.** Generado por `generate_exercise_prompts.py` — no editar a mano.",
    "",
    "## Cómo usarlo",
    "",
    "0. **(una sola vez)** Genera la primera imagen, ajusta el estilo hasta que te "
    "guste y **guárdala como imagen de referencia**.",
    "1. Para cada ejercicio: pega el prompt en Nano Banana Pro **y adjunta la imagen "
    "de referencia** diciendo *\"mantén exactamente este estilo, paleta, encuadre y fondo\"*.",
    f"2. Guarda el resultado en `public/exercises/` con **el nombre exacto** indicado "
    f"(`NNN-slug.{IMG_EXT}`). La imagen aparece sola en la tarjeta del ejercicio.",
    "",
    "---",
    "",
]

for i, ex in enumerate(exercises, start=1):
    fname = image_filename(i, ex[0])
    out.append(f"## {i:03d} / {total} · {ex[0]}")
    out.append("")
    out.append(f"- **Archivo:** `public/exercises/{fname}`")
    out.append(f"- **Músculo:** {ex[1]}  ·  **Equipo:** {ex[3]}")
    out.append("")
    out.append("```text")
    out.append(build_prompt(ex))
    out.append("```")
    out.append("")

with open("exercise-prompts.md", "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")

print(f"✓ exercise-prompts.md ({total} prompts)")
if collisions:
    print(f"  ({len(collisions)} colisiones de slug — desambiguadas por el prefijo NNN)")
