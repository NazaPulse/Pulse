<script setup lang="ts">
import * as schedule from "@shared/schedule";
import type { TimeBlock } from "../../types/productivity";

/** Semana de lunes a domingo: una fila de 24 h por día; clic en una fila abre ese día. */
defineProps<{
  day: Date;
  blocks: TimeBlock[];
  conflicts: ReadonlySet<string>;
  today: Date;
}>();
const emit = defineEmits<{ openDay: [day: Date] }>();

const MARKS = [0, 6, 12, 18, 24].map((hour) => hour * 60);
const ROW_GRID = {
  backgroundImage: schedule.gridStyle(schedule.FULL_DAY, "day").backgroundImage,
  backgroundSize: "calc(100% / 24) 100%",
};

const markClass = (minute: number) =>
  minute === 0
    ? ""
    : minute === schedule.DAY_MINUTES
      ? "-translate-x-full"
      : "-translate-x-1/2";
const plannedOn = (blocks: TimeBlock[], date: Date) =>
  schedule
    .blocksOnDay(blocks, date)
    .reduce((sum, block) => sum + schedule.plannedMinutes(block), 0);
</script>

<template>
  <div class="flex flex-col gap-1.5 p-4">
    <!-- Mismo esqueleto que las filas (etiqueta + pista) para que las horas queden alineadas. -->
    <div class="flex gap-3 border border-transparent px-2" aria-hidden="true">
      <span class="w-20 shrink-0" />
      <div class="relative h-5 flex-1">
        <span
          v-for="minute in MARKS"
          :key="minute"
          :class="[
            'absolute font-mono text-[0.625rem] text-fg-dim',
            markClass(minute),
          ]"
          :style="{ left: schedule.minuteToPercent(minute) }"
        >
          {{ schedule.formatMinute(minute) }}
        </span>
      </div>
    </div>

    <button
      v-for="date in schedule.weekDays(day)"
      :key="date.toISOString()"
      type="button"
      :class="[
        'group flex items-center gap-3 rounded-lg border px-2 py-1.5 text-left transition hover:border-accent/50',
        schedule.isSameDay(date, today)
          ? 'border-accent/40 bg-accent/5'
          : 'border-line',
      ]"
      @click="emit('openDay', date)"
    >
      <span class="w-20 shrink-0">
        <span
          :class="[
            'block text-xs font-semibold',
            schedule.isSameDay(date, today) ? 'text-accent' : 'text-fg-soft',
          ]"
        >
          {{ schedule.shortDayLabel(date) }}
        </span>
        <span class="block font-mono text-[0.625rem] text-fg-dim">
          {{ schedule.durationLabel(plannedOn(blocks, date)) }}
        </span>
      </span>
      <span class="relative h-8 flex-1 rounded-md" :style="ROW_GRID">
        <span
          v-for="block in schedule.blocksOnDay(blocks, date)"
          :key="block.id"
          :title="`${block.title} · ${schedule.spanLabel(schedule.blockSpan(block, date))}`"
          class="absolute inset-y-1 overflow-hidden rounded border"
          :style="{
            ...schedule.spanStyle(schedule.blockSpan(block, date)),
            ...schedule.blockColors(block.category, conflicts.has(block.id))
              .planned,
          }"
        >
          <span
            class="absolute bottom-0 left-0 h-1"
            :style="{
              width: `${schedule.actualRatio(block) * 100}%`,
              ...schedule.blockColors(block.category, false).actual,
            }"
          />
        </span>
      </span>
    </button>
  </div>
</template>
