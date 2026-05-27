alter table workout_templates
  add column if not exists bg_color text,
  add column if not exists text_color text;

alter table program_workouts
  add column if not exists bg_color text,
  add column if not exists text_color text;

update workout_templates
set
  bg_color = case
    when lower(coalesce(training_type, '')) in ('warmup', 'warm up') then '#a9d6e5'
    when lower(coalesce(training_type, '')) in ('speed accelerator', 'speed_accelerator', 'speed') then '#fae0e4'
    when lower(coalesce(training_type, '')) in ('edge work', 'edge_work') then '#dec9e9'
    when lower(coalesce(training_type, '')) in ('conditioning') then '#ffedd8'
    else bg_color
  end,
  text_color = case
    when lower(coalesce(training_type, '')) in ('warmup', 'warm up') then '#014f86'
    when lower(coalesce(training_type, '')) in ('speed accelerator', 'speed_accelerator', 'speed') then '#ff7096'
    when lower(coalesce(training_type, '')) in ('edge work', 'edge_work') then '#815ac0'
    when lower(coalesce(training_type, '')) in ('conditioning') then '#a47148'
    else text_color
  end
where bg_color is null or text_color is null;

update program_workouts pw
set
  bg_color = coalesce(pw.bg_color, wt.bg_color),
  text_color = coalesce(pw.text_color, wt.text_color)
from workout_templates wt
where pw.workout_template_id = wt.id
  and (pw.bg_color is null or pw.text_color is null);
