import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Pato from "./Pato";

const patito = () => screen.getByRole("img");

describe("Pato", () => {
  it("está quieto cuando el reloj está en pausa", () => {
    render(<Pato modo="enfoque" corriendo={false} />);

    expect(patito()).toHaveClass("pato--quieto");
    expect(patito()).toHaveAccessibleName(/esperando/i);
  });

  it("trabaja durante el enfoque", () => {
    render(<Pato modo="enfoque" corriendo />);

    expect(patito()).toHaveClass("pato--trabaja");
    expect(patito()).toHaveAccessibleName(/trabajando/i);
    expect(patito()).not.toHaveClass("pato--quieto");
  });

  it("duerme durante el descanso corto", () => {
    render(<Pato modo="descanso-corto" corriendo />);

    expect(patito()).toHaveClass("pato--duerme");
    expect(patito()).toHaveAccessibleName(/descansando/i);
  });

  it("duerme también durante el descanso largo", () => {
    render(<Pato modo="descanso-largo" corriendo />);
    expect(patito()).toHaveClass("pato--duerme");
  });

  it("dibuja las tres poses (ojos, Zzz y chispas)", () => {
    const { container } = render(<Pato modo="enfoque" corriendo />);

    expect(container.querySelectorAll(".pato__ojo-abierto")).toHaveLength(1);
    expect(container.querySelector(".pato__ojo-cerrado")).toBeInTheDocument();
    expect(container.querySelectorAll(".pato__z")).toHaveLength(3);
    expect(container.querySelectorAll(".pato__chispa")).toHaveLength(2);
  });
});
