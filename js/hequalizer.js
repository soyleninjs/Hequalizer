/* eslint-disable no-empty-function, no-unused-vars */

/*
 * En el metodo destroy ahora se le puede pasar un parametro Booleano para tambien destruir la instacia totalmente ✅
 * Nuevo metodo en el objeto global para borrar directamente una instancia con base a su ID ✅
 * Se cambiara el core, para que el responsive solo funcione en un primer nivel y se puedan se configurar
   mas facil en responsive con un nuevo script ✅
 * Se elimino el sistema de debug. ✅
 * Se removieron los metodos de startResizeCalculation, stopResizeCalculation, startChangesObserver, stopChangesObserver
   de la instancia, se cambiaron a metodos internos ✅
 * Se Coloco la nueva opcion de activar o desactivar el resize ✅
 * Se removio la "autoInit" opcion ✅
 * Nuevos datos en la instancia (actualBreakpoint, actualOptions, responsive) ✅
 * Limpieza y optmizacion de codigo interno ✅
 * Nueva opcion "responsive", es un objeto en el cual solo se pueden actualizar/cambiar las siguientes propiedades ✅
    - cssVariable
    - columns
    - initialIndex
    - resizeObserver
    - classElementToOmit
    - on y todos sus metodos internos
 * 
 * 
 * 
 * 
 * Demo
 * Nuevo Diseño de Elementos ✅
 * Agregar bloque de codigo de ejemplo ✅
 * 
 * 
 * 
 * 
 */

const HequalizerUtils = {
  mergeDeepObject: (...objects) => {
    const isObject = (obj) => obj && typeof obj === 'object';

    return objects.reduce((prev, obj) => {
      Object.keys(obj).forEach((key) => {
        const pVal = prev[key];
        const oVal = obj[key];

        if (Array.isArray(pVal) && Array.isArray(oVal)) {
          prev[key] = [...new Set([...oVal, ...pVal])];
        } else if (isObject(pVal) && isObject(oVal)) {
          prev[key] = HequalizerUtils.mergeDeepObject(pVal, oVal);
        } else {
          prev[key] = oVal;
        }
      });

      return prev;
    }, {});
  },
  uniqueID() {
    const random = Math.random().toString(36).substr(2);
    const fecha = Date.now().toString(36);
    return fecha + random;
  },
  returnArrayData(data) {
    return Array.isArray(data) ? data : [data];
  },
  cssVariable(DOMElements, cssVariable, cssVariableValue = null) {
    const elements = HequalizerUtils.returnArrayData(DOMElements);

    if (!elements || elements.length === 0) {
      return;
    }

    elements.forEach((element, index) => {
      if (cssVariableValue === null) {
        element.style.removeProperty(cssVariable);
        return;
      }

      element.style.setProperty(cssVariable, cssVariableValue);
    });
  },
  classElements(DOMElements, status, classes) {
    const classesArray = HequalizerUtils.returnArrayData(classes);
    const elements = HequalizerUtils.returnArrayData(DOMElements);

    if (!elements || elements.length === 0) {
      return;
    }

    elements.forEach((element) => {
      if (status === 'add') {
        element.classList.add(...classesArray);
      }
      if (status === 'remove') {
        element.classList.remove(...classesArray);
      }
    });
  },
};

function Hequalizer(nodeElementsArray, newOptions = {}) {
  // ------------------------ VARAIBLES ------------------------

  let actualOptions, filteredElements;
  let totalOptions = {};
  let elementsChangesObservers = [];
  let dontCalc = false;
  const classes = {
    zero: 'height-zero',
    calculating: 'height-calculating',
    complete: 'height-calculated',
  };
  const baseOptions = {
    cssVariable: '--height',
    columns: "all",
    initialIndex: 0,
    resizeObserver: true,
    classElementToOmit: '',
    on: {
      init: (data, instance) => {},
      afterResize: (data, instance) => {},
      afterChanges: (data, instance) => {},
      afterUpdate: (data, instance) => {},
      afterDestroy: (instance) => {},
    },
    responsive: {}
  };

  this.id = HequalizerUtils.uniqueID();
  this.elementsArray = nodeElementsArray;
  this.values = 0;
  this.responsive = newOptions.responsive || {}
  let lastBreakpoint = null;
  const breakpoints = Object.keys(this.responsive)
    .sort((a, b) => a - b)
    .map((number) => Number(number));

  // ------------------------ END VARAIBLES ------------------------

  // ------------------------ FUNCTIONALITY ------------------------

  const prepareData = (options) => {
    actualOptions = options;
    filteredElements = [...nodeElementsArray].filter((element, index) => {
      if (actualOptions.initialIndex > 0) {
        if (index >= actualOptions.initialIndex) {
          return element;
        }
      } else {
        return element;
      }

      return false;
    });
  }

  const configAllOptions = () => {   
    totalOptions.default = HequalizerUtils.mergeDeepObject(baseOptions, newOptions);
    breakpoints.forEach((breakpoint) => {
      totalOptions[breakpoint] = HequalizerUtils.mergeDeepObject(baseOptions, newOptions, this.responsive[breakpoint]);
    });
  }

  const setActualOptions = () => {   
    const breakpointActual = breakpoints.find((breakpoint) => window.innerWidth <= breakpoint);

    if (lastBreakpoint !== breakpointActual) {
      if (breakpointActual === undefined) {
        prepareData(totalOptions.default)
        this.actualBreakpoint = "default"
      } else {
        prepareData(totalOptions[breakpointActual])
        this.actualBreakpoint = breakpointActual
      }
      lastBreakpoint = breakpointActual;
      this.actualOptions = actualOptions
    }
  }

  const setCallbacks = (calledOn, data) => {
    if (calledOn === 'init') {
      actualOptions.on.init(data, this);
    }
    if (calledOn === 'resize') {
      actualOptions.on.afterResize(data, this);
    }
    if (calledOn === 'changes') {
      actualOptions.on.afterChanges(data, this);
    }
    if (calledOn === 'update') {
      actualOptions.on.afterUpdate(data, this);
    }
    if (calledOn === 'destroy') {
      actualOptions.on.afterDestroy(this);
    }
  };

  const setMaxHeightElements = (calledOn) => {
    let maxValue = 0;

    if (!actualOptions.resizeObserver) {
      if (dontCalc) return;
      HequalizerUtils.cssVariable([...filteredElements], actualOptions.cssVariable);
      HequalizerUtils.classElements([...filteredElements], 'remove', [classes.zero, classes.complete]);
      this.values = maxValue;
      dontCalc = true
      return;
    }
    dontCalc = false

    if (actualOptions.columns == "all") {
      maxValue = 0;
      const $elements = [...filteredElements];

      HequalizerUtils.cssVariable($elements, actualOptions.cssVariable);
      HequalizerUtils.classElements($elements, 'remove', [classes.zero, classes.calculating, classes.complete]);
      HequalizerUtils.classElements($elements, 'add', classes.calculating);

      $elements.forEach(($element, index) => {
        const elementToOmit = $element.classList.contains(
          actualOptions.classElementToOmit,
        );

        if ($element.offsetHeight > maxValue && !elementToOmit) {
          maxValue = $element.offsetHeight;
        }
      });

      HequalizerUtils.cssVariable($elements, actualOptions.cssVariable, `${maxValue}px`);
      HequalizerUtils.classElements($elements, 'remove', classes.calculating);
      if (maxValue > 0) {
        HequalizerUtils.classElements($elements, 'add', classes.complete);
      } else {
        HequalizerUtils.classElements($elements, 'add', classes.zero);
      }

      this.values = maxValue;
      setCallbacks(calledOn, maxValue);
    } else {
      const groupsElements = [];
      const arrayMaxValues = [];
      const $elements = [...filteredElements];

      let totalItems = $elements.length;
      while (totalItems !== 0) {
        const lastGroup = $elements.splice(0, actualOptions.columns);
        groupsElements.push(lastGroup);
        totalItems = $elements.length;
      }

      groupsElements.forEach(($group) => {
        maxValue = 0;

        HequalizerUtils.cssVariable($group, actualOptions.cssVariable);
        HequalizerUtils.classElements($group, 'remove', [classes.zero, classes.calculating, classes.complete]);
        HequalizerUtils.classElements($group, 'add', classes.calculating);

        $group.forEach((element, index) => {
          const elementToOmit = element.classList.contains(
            actualOptions.classElementToOmit,
          );

          if (element.offsetHeight > maxValue && !elementToOmit) {
            maxValue = element.offsetHeight;
          }
        });

        HequalizerUtils.cssVariable($group, actualOptions.cssVariable, `${maxValue}px`);
        HequalizerUtils.classElements($group, 'remove', classes.calculating);
        if (maxValue > 0) {
          HequalizerUtils.classElements($group, 'add', classes.complete);
        } else {
          HequalizerUtils.classElements($group, 'add', classes.zero);
        }

        arrayMaxValues.push(maxValue);
      });

      this.values = arrayMaxValues;
      setCallbacks(calledOn, arrayMaxValues);
    }
  };

  const cleanHeightElements = () => {
    [...filteredElements].forEach(($element, index) => {
      $element.style.removeProperty(actualOptions.cssVariable);
    });
  };

  const updateAfterResize = () => {
    setActualOptions()
    setMaxHeightElements('resize');
  };

  const updateAfterChanges = () => {
    setMaxHeightElements('changes');
  };

  const setChangesObserver = () => {
    [...filteredElements].forEach((element) => {
      const elementChangesObserver = new window.MutationObserver(updateAfterChanges);
      elementsChangesObservers.push(elementChangesObserver);
    });
  };

  const startResizeCalculation = () => {
    window.addEventListener('resize', updateAfterResize);
  };

  const stopResizeCalculation = () => {
    window.removeEventListener('resize', updateAfterResize);
  };

  const startChangesObserver = () => {
    setChangesObserver();
    [...filteredElements].forEach((element, index) => {
      elementsChangesObservers[index].observe(element, {
        childList: true,
        subtree: true,
      });
    });
  };

  const stopChangesObserver = () => {
    [...filteredElements].forEach((element, index) => {
      elementsChangesObservers[index].disconnect();
    });
    elementsChangesObservers = [];
  };

  // ------------------------ END FUNCTIONALITY ------------------------

  // ------------------------ METHODS ------------------------

  this.update = () => {
    setMaxHeightElements('update');
  };

  this.init = () => {
    configAllOptions();
    setActualOptions();
    setMaxHeightElements('init');
    startResizeCalculation();
    startChangesObserver();
  };

  this.destroy = (destroyInstance = false) => {
    cleanHeightElements();
    stopResizeCalculation();
    stopChangesObserver();
    this.values = 0;

    if (destroyInstance) {
      window.HequalizerAPI.removeInstance(this.id)

      for (let prop in this) {
        if (this.hasOwnProperty(prop)) {
          delete this[prop];
        }
      }
    }

    setCallbacks('destroy');
  };

  // ------------------------ END METHODS ------------------------

  // ------------------------ INIT ------------------------

  document.fonts.ready
    .then(() => {
      this.init();
    })
    .catch((error) => {
      window.console.log(error);
    });

  window.HequalizerAPI.Instances.push(this);
  return this;
  // ------------------------ END INIT ------------------------
}

window.HequalizerAPI = window.HequalizerAPI || {
  Init: Hequalizer,
  Instances: [],
  removeInstance: (id) => {
    const cleanInstances = window.HequalizerAPI.Instances.filter((instance) => {
      return instance.id !== id
    })

    window.HequalizerAPI.Instances = cleanInstances
  } 
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Hequalizer;
}
