import { Schema, model, type Document } from 'mongoose'

import { DEFAULT_PRIORIDAD, type PrioridadId } from '../constants/prioridades.js'
import { DEFAULT_TIPO_LUGAR, type TipoLugarId } from '../constants/placeTypes.js'

export interface SuministroNecesario {
  categoria: string
  articulos: string[]
}

export interface ICentro extends Document {
  email?: string
  password?: string
  nombre: string
  tipoLugar: TipoLugarId
  prioridad: PrioridadId
  lat?: number
  lng?: number
  direccion?: string
  estado?: string
  telefonos: string[]
  correosContacto: string[]
  sitiosWeb: string[]
  suministrosNecesarios: SuministroNecesario[]
  imagenes: string[]
  imagenPrincipal?: string
  createdAt: Date
  updatedAt: Date
}

const suministroNecesarioSchema = new Schema<SuministroNecesario>(
  {
    categoria: { type: String, required: true, trim: true },
    articulos: { type: [String], default: [] },
  },
  { _id: false },
)

const centroSchema = new Schema<ICentro>(
  {
    email: { type: String, trim: true, lowercase: true },
    password: { type: String },
    nombre: { type: String, required: true, trim: true },
    tipoLugar: { type: String, default: DEFAULT_TIPO_LUGAR },
    prioridad: { type: String, default: DEFAULT_PRIORIDAD },
    lat: { type: Number },
    lng: { type: Number },
    direccion: { type: String, trim: true },
    estado: { type: String, trim: true },
    telefonos: { type: [String], default: [] },
    correosContacto: { type: [String], default: [] },
    sitiosWeb: { type: [String], default: [] },
    suministrosNecesarios: { type: [suministroNecesarioSchema], default: [] },
    imagenes: { type: [String], default: [] },
    imagenPrincipal: { type: String, trim: true },
  },
  { timestamps: true },
)

centroSchema.index({ email: 1 }, { unique: true, sparse: true })

centroSchema.pre('save', function () {
  if (this.email == null || this.email === '') {
    this.email = undefined
  }
})

export const Centro = model<ICentro>('Centro', centroSchema)
