-- Seeds a curated library of common BJJ techniques so users can search and
-- select from correctly-spelled, consistently-cased names instead of typing
-- free text every time. created_by is left null (system-seeded, same as the
-- original techniques), so these aren't deletable by any single user.
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- or save as a migration file if using the Supabase CLI.

insert into techniques (name, category) values
  ('Armbar', 'submission'),
  ('Triangle Choke', 'submission'),
  ('Rear Naked Choke', 'submission'),
  ('Guillotine Choke', 'submission'),
  ('Kimura', 'submission'),
  ('Americana', 'submission'),
  ('Omoplata', 'submission'),
  ('Ezekiel Choke', 'submission'),
  ('D''Arce Choke', 'submission'),
  ('Anaconda Choke', 'submission'),
  ('Bow and Arrow Choke', 'submission'),
  ('Heel Hook', 'submission'),
  ('Kneebar', 'submission'),
  ('Toe Hold', 'submission'),
  ('Straight Ankle Lock', 'submission'),

  ('Scissor Sweep', 'sweep'),
  ('Hip Bump Sweep', 'sweep'),
  ('Flower Sweep', 'sweep'),
  ('Butterfly Sweep', 'sweep'),
  ('Pendulum Sweep', 'sweep'),
  ('X-Guard Sweep', 'sweep'),
  ('Tripod Sweep', 'sweep'),
  ('Sickle Sweep', 'sweep'),
  ('Balloon Sweep', 'sweep'),
  ('Lumberjack Sweep', 'sweep'),

  ('Double Leg', 'takedown'),
  ('Single Leg', 'takedown'),
  ('Ankle Pick', 'takedown'),
  ('Foot Sweep', 'takedown'),
  ('Hip Toss', 'takedown'),
  ('Fireman''s Carry', 'takedown'),
  ('Arm Drag', 'takedown'),
  ('Snap Down', 'takedown'),
  ('Duck Under', 'takedown'),
  ('Uchi Mata', 'takedown'),

  ('Upa Escape', 'escape'),
  ('Hip Escape', 'escape'),
  ('Elbow Escape', 'escape'),
  ('Back Escape', 'escape'),
  ('Guard Recovery', 'escape'),
  ('Bridge and Roll', 'escape'),
  ('Knee Escape', 'escape'),
  ('Turtle Escape', 'escape'),

  ('Toreando Pass', 'guard pass'),
  ('Knee Slice Pass', 'guard pass'),
  ('Stack Pass', 'guard pass'),
  ('Leg Drag', 'guard pass'),
  ('Double Under Pass', 'guard pass'),
  ('X-Pass', 'guard pass'),
  ('Long Step Pass', 'guard pass'),
  ('Over-Under Pass', 'guard pass'),
  ('Smash Pass', 'guard pass'),
  ('Folding Pass', 'guard pass'),

  ('Hip Heist', 'guard retention'),
  ('Berimbolo', 'guard retention'),
  ('De La Riva Recovery', 'guard retention'),
  ('Knee Shield Recovery', 'guard retention'),
  ('Technical Stand-Up', 'guard retention'),
  ('Reguard', 'guard retention'),
  ('Inversion Recovery', 'guard retention'),
  ('Butterfly Hooks Recovery', 'guard retention')
on conflict (name) do nothing;
