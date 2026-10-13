import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Modo } from "../lib/storage";
import AnilloProgreso from "./AnilloProgreso";

const RADIO = 148;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

const pintar = (progreso: number, modo: Modo = "enfoque") => {
  const { container } = render(<AnilloProgreso progreso={progreso} modo={modo} />);
  return container.querySelector(".anillo__progreso") as SVGCircleElement;
};

describe("AnilloProgreso", () => {
  it("empieza vacío", () => {
    const circulo = pintar(0);
    expect(circulo.getAttribute("stroke-dashoffset")).toBe(String(CIRCUNFERENCIA));
  });

  it("se llena a la mitad", () => {
    const circulo = pintar(0.5);
    expect(Number(circulo.getAttribute("stroke-dashoffset"))).toBeCloseTo(
      CIRCUNFERENCIA / 2,
      5,
    );
  });

  it("se completa al terminar", () => {
    const circulo = pintar(1);
    expect(circulo.getAttribute("stroke-dashoffset")).toBe("0");
  });

  it("lleva el color del modo que está activo", () => {
    expect(pintar(0.2, "enfoque")).toHaveClass("anillo__progreso--enfoque");
    expect(pintar(0.2, "descanso-corto")).toHaveClass("anillo__progreso--descanso-corto");
    expect(pintar(0.2, "descanso-largo")).toHaveClass("anillo__progreso--descanso-largo");
  });

  it("dibuja la pista completa del anillo", () => {
    const { container } = render(<AnilloProgreso progreso={0} modo="enfoque" />);
    const pista = container.querySelector(".anillo__pista") as SVGCircleElement;
    expect(pista.getAttribute("stroke-dasharray")).toBeNull();
    expect(pista.getAttribute("r")).toBe(String(RADIO));
  });
});
