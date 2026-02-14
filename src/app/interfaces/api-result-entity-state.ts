export interface IApiResultEntityState {
    entity_id: string,
    attributes: IAPiResultEntityStateAttribute
}

export interface IAPiResultEntityStateAttribute {
    friendly_name: string
}

export interface IAvailableScript {
    EntityId: string,
    Name: string,
    Active: boolean
}