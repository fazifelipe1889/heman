-- Popula el campo tags con aliases/sinónimos para los ejercicios más buscados.
-- Permite que la búsqueda fuzzy encuentre ejercicios por términos alternativos
-- aunque el diccionario de sinónimos client-side no los cubra.

update exercises set tags = ARRAY['hip thrust', 'empuje de cadera', 'puente de gluteos', 'glute bridge']
  where name ilike '%Hip Thrust%';

update exercises set tags = ARRAY['lat pulldown', 'jalón', 'jalon', 'polea dorsal', 'lats']
  where name ilike '%Jalón al Pecho%' or name ilike '%Jalon al Pecho%';

update exercises set tags = ARRAY['deadlift', 'peso muerto', 'dl']
  where name ilike '%Peso Muerto Convencional%';

update exercises set tags = ARRAY['rdl', 'romanian deadlift', 'peso muerto rumano', 'deadlift rumano']
  where name ilike '%Peso Muerto Rumano%';

update exercises set tags = ARRAY['sumo deadlift', 'peso muerto sumo']
  where name ilike '%Peso Muerto Sumo%';

update exercises set tags = ARRAY['squat', 'back squat', 'sentadilla', 'cuadriceps']
  where name ilike '%Sentadilla con Barra Alta%' or name ilike '%Sentadilla con Barra Baja%';

update exercises set tags = ARRAY['front squat', 'sentadilla frontal', 'squat frontal']
  where name ilike '%Sentadilla Frontal%';

update exercises set tags = ARRAY['goblet squat', 'sentadilla con kettlebell']
  where name ilike '%Goblet%';

update exercises set tags = ARRAY['bench press', 'press de banca', 'pecho', 'empuje horizontal']
  where name ilike '%Press de Banca Plano%';

update exercises set tags = ARRAY['incline bench', 'press inclinado', 'press de banca inclinado']
  where name ilike '%Press de Banca Inclinado%' or name ilike '%Press Inclinado%';

update exercises set tags = ARRAY['military press', 'overhead press', 'ohp', 'press sobre la cabeza']
  where name ilike '%Press Militar%';

update exercises set tags = ARRAY['pull-up', 'pullup', 'dominadas', 'chin-up']
  where name ilike '%Dominadas Agarre Prono%';

update exercises set tags = ARRAY['chin-up', 'chinup', 'dominadas supino', 'pull-up supino']
  where name ilike '%Dominadas Agarre Supino%';

update exercises set tags = ARRAY['dips', 'fondos', 'paralelas', 'chest dips']
  where name ilike '%Fondos en Paralelas%' and name ilike '%Pecho%';

update exercises set tags = ARRAY['dips triceps', 'fondos triceps', 'paralelas']
  where name ilike '%Fondos en Paralelas%' and name ilike '%Triceps%';

update exercises set tags = ARRAY['row', 'remo', 'traccion horizontal', 'barbell row']
  where name ilike '%Remo con Barra Prono%';

update exercises set tags = ARRAY['cable row', 'remo con cable', 'polea remo', 'seated row']
  where name ilike '%Remo en Maquina Sentado%' or name ilike '%Remo con Cable Sentado%';

update exercises set tags = ARRAY['face pull', 'remo cara', 'deltoid posterior', 'rear delt']
  where name ilike '%Face Pull%';

update exercises set tags = ARRAY['skullcrusher', 'skull crusher', 'triceps', 'press frances']
  where name ilike '%Press Francés%' or name ilike '%Press Frances%';

update exercises set tags = ARRAY['lateral raise', 'elevaciones laterales', 'side raise', 'deltoid lateral']
  where name ilike '%Elevaciones Laterales%' and equipment = 'Mancuernas';

update exercises set tags = ARRAY['bicep curl', 'curl de biceps', 'barbell curl']
  where name ilike '%Curl de Bíceps con Barra%' or name ilike '%Curl de Biceps con Barra%';

update exercises set tags = ARRAY['hammer curl', 'curl martillo', 'neutral curl']
  where name ilike '%Curl Martillo%';

update exercises set tags = ARRAY['leg press', 'prensa', 'cuadriceps', 'leg machine']
  where name ilike '%Prensa de Piernas%';

update exercises set tags = ARRAY['leg extension', 'extension de cuadriceps', 'quad machine']
  where name ilike '%Extensión de Cuadriceps%' or name ilike '%Extension de Cuadriceps%';

update exercises set tags = ARRAY['leg curl', 'curl de isquios', 'hamstring curl']
  where name ilike '%Curl de Piernas%';

update exercises set tags = ARRAY['calf raise', 'elevacion de talones', 'pantorrilla']
  where name ilike '%Elevación de Talones%' or name ilike '%Elevacion de Talones%';

update exercises set tags = ARRAY['lunge', 'zancada', 'estocada']
  where name ilike '%Zancada%';

update exercises set tags = ARRAY['bulgarian split squat', 'sentadilla bulgara', 'split squat']
  where name ilike '%Bulgara%' or name ilike '%Búlgara%';

update exercises set tags = ARRAY['hip abduction', 'abduccion de cadera', 'gluteo medio']
  where name ilike '%Abducción de Cadera%' or name ilike '%Abduccion de Cadera%';

update exercises set tags = ARRAY['plank', 'plancha', 'core isometrico']
  where name ilike '%Plancha Frontal%';

update exercises set tags = ARRAY['crunch', 'abdominal', 'abs']
  where name ilike '%Crunch Abdominal%';

update exercises set tags = ARRAY['hanging leg raise', 'elevacion de piernas colgando', 'abs colgado']
  where name ilike '%Elevación de Piernas Colgando%' or name ilike '%Elevacion de Piernas Colgando%';

update exercises set tags = ARRAY['shrug', 'encogimientos', 'trap', 'trapecios']
  where name ilike '%Encogimientos con Barra%';

update exercises set tags = ARRAY['good morning', 'buenos dias', 'hip hinge', 'bisagra']
  where name ilike '%Buenos Dias%' or name ilike '%Buenos Días%';

update exercises set tags = ARRAY['nordic curl', 'nordico', 'hamstring eccentric', 'isquios']
  where name ilike '%Nordic Curl%';

update exercises set tags = ARRAY['push-up', 'pushup', 'flexiones', 'pecho cuerpo']
  where name ilike '%Flexiones (Push-ups)%';

update exercises set tags = ARRAY['ab wheel', 'rodillo abdominal', 'rollout', 'antiextension']
  where name ilike '%Ab Wheel%' or name ilike '%Rollout%';

update exercises set tags = ARRAY['farmers walk', 'farmer carry', 'caminata con peso', 'grip']
  where name ilike '%Farmer Walk%';

update exercises set tags = ARRAY['kettlebell swing', 'swing', 'bisagra explosiva']
  where name ilike '%Swing con Kettlebell%';

update exercises set tags = ARRAY['turkish get up', 'tgu', 'kettlebell suelo a pie']
  where name ilike '%Turkish Get-Up%';

update exercises set tags = ARRAY['cable fly', 'aperturas cable', 'cruce de poleas', 'pec fly']
  where name ilike '%Cruce de Poleas%';

update exercises set tags = ARRAY['hack squat', 'sentadilla hack', 'cuadriceps maquina']
  where name ilike '%Hack Squat%';

update exercises set tags = ARRAY['pallof press', 'antirrotacion core', 'core cable']
  where name ilike '%Pallof Press%';

update exercises set tags = ARRAY['hyperextension', 'hiperextension', 'espalda baja', 'roman chair']
  where name ilike '%Hiperextensiones en Banco Romano%';

update exercises set tags = ARRAY['step up', 'step-up', 'escalonado', 'unilateral pierna']
  where name ilike '%Step-Up%';

update exercises set tags = ARRAY['arnold press', 'press arnold', 'hombros rotacion']
  where name ilike '%Press Arnold%';
