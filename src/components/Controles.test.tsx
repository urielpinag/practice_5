import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Controles from "./Controles";

const manejadores = () => ({
  onAlternar: vi.fn(),
  onReiniciar: vi.fn(),
  onSaltar: vi.fn(),
});

describe("Controles", () => {
  it("muestra «Iniciar» cuando el reloj está parado", () => {
    render(<Controles corriendo={false} {...manejadores()} />);

    const principal = screen.getByRole("button", { name: /^iniciar el tiempo$/i });
    expect(principal).toHaveTextContent("Iniciar");
    expect(screen.queryByText("Pausar")).not.toBeInTheDocument();
  });

  it("muestra «Pausar» y avisa al hacer clic", () => {
    const manejadoresMock = manejadores();
    render(<Controles corriendo {...manejadoresMock} />);

    const principal = screen.getByRole("button", { name: /^pausar el tiempo$/i });
    expect(principal).toHaveTextContent("Pausar");

    fireEvent.click(principal);
    expect(manejadoresMock.onAlternar).toHaveBeenCalledTimes(1);
  });

  it("avisa al reiniciar y al saltar", () => {
    const manejadoresMock = manejadores();
    render(<Controles corriendo={false} {...manejadoresMock} />);

    fireEvent.click(screen.getByRole("button", { name: /^reiniciar el tiempo$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^saltar al siguiente modo$/i }));

    expect(manejadoresMock.onReiniciar).toHaveBeenCalledTimes(1);
    expect(manejadoresMock.onSaltar).toHaveBeenCalledTimes(1);
    expect(manejadoresMock.onAlternar).not.toHaveBeenCalled();
  });
});
