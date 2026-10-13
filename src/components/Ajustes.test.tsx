import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Ajustes } from "../lib/storage";
import PanelAjustes from "./Ajustes";

const AJUSTES: Ajustes = {
  enfoque: 25,
  descansoCorto: 5,
  descansoLargo: 15,
  pomodorosAntesDescansoLargo: 4,
};

const montar = (abierto = true) => {
  const onCambiar = vi.fn();
  const onRestablecer = vi.fn();
  const vista = render(
    <PanelAjustes
      abierto={abierto}
      ajustes={AJUSTES}
      onCambiar={onCambiar}
      onRestablecer={onRestablecer}
    />,
  );
  return { onCambiar, onRestablecer, ...vista };
};

describe("Ajustes", () => {
  it("muestra los valores actuales", () => {
    montar();

    expect(screen.getByLabelText("Enfoque")).toHaveValue(25);
    expect(screen.getByLabelText("Descanso corto")).toHaveValue(5);
    expect(screen.getByLabelText("Descanso largo")).toHaveValue(15);
    expect(screen.getByLabelText("Enfoques por ciclo")).toHaveValue(4);
  });

  it("guarda el valor nuevo al salir del campo", () => {
    const { onCambiar } = montar();
    const input = screen.getByLabelText("Enfoque");

    fireEvent.change(input, { target: { value: "40" } });
    fireEvent.blur(input);

    expect(onCambiar).toHaveBeenCalledWith({ ...AJUSTES, enfoque: 40 });
  });

  it("acota los valores que se pasan del máximo", () => {
    const { onCambiar } = montar();
    const input = screen.getByLabelText("Descanso corto");

    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.blur(input);

    expect(onCambiar).toHaveBeenCalledWith({ ...AJUSTES, descansoCorto: 180 });
    expect(input).toHaveValue(180);
  });

  it("acota también por abajo", () => {
    const { onCambiar } = montar();
    const input = screen.getByLabelText("Enfoques por ciclo");

    fireEvent.change(input, { target: { value: "-3" } });
    fireEvent.blur(input);

    expect(onCambiar).toHaveBeenCalledWith({ ...AJUSTES, pomodorosAntesDescansoLargo: 1 });
    expect(input).toHaveValue(1);
  });

  it("si el campo queda vacío vuelve al valor anterior", () => {
    const { onCambiar } = montar();
    const input = screen.getByLabelText("Enfoque");

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(onCambiar).not.toHaveBeenCalled();
    expect(input).toHaveValue(25);
  });

  it("no avisa si el valor no cambió", () => {
    const { onCambiar } = montar();
    const input = screen.getByLabelText("Enfoque");

    fireEvent.change(input, { target: { value: "25" } });
    fireEvent.blur(input);

    expect(onCambiar).not.toHaveBeenCalled();
  });

  it("confirma con la tecla Enter", () => {
    const { onCambiar } = montar();
    const input = screen.getByLabelText("Descanso largo");

    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCambiar).toHaveBeenCalledWith({ ...AJUSTES, descansoLargo: 30 });
  });

  it("restablece los valores por defecto", () => {
    const { onRestablecer } = montar();

    fireEvent.click(screen.getByRole("button", { name: /valores de siempre/i }));

    expect(onRestablecer).toHaveBeenCalledTimes(1);
  });

  it("se sincroniza si el valor de afuera cambia", () => {
    const { rerender } = render(
      <PanelAjustes
        abierto
        ajustes={AJUSTES}
        onCambiar={vi.fn()}
        onRestablecer={vi.fn()}
      />,
    );

    rerender(
      <PanelAjustes
        abierto
        ajustes={{ ...AJUSTES, enfoque: 50 }}
        onCambiar={vi.fn()}
        onRestablecer={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Enfoque")).toHaveValue(50);
  });

  it("se marca como oculto cuando está cerrado", () => {
    const { container } = montar(false);
    expect(container.querySelector(".ajustes")).toHaveAttribute("aria-hidden", "true");
  });
});
