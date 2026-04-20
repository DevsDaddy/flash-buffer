/**
 * Flash Buffer Schema Tests
 *
 * @developer           Elijah Rastorguev
 * @version             1.1.0
 * @build               1008
 * @git                 https://github.com/devsdaddy/flash-buffer/
 * @docs                https://github.com/devsdaddy/flash-buffer/#readme
 * @updated             20.04.2026
 */
import {beforeAll, describe, expect, it} from 'vitest';
import {FlashBufferSchema, field, FlashBuffer} from "../src";

/**
 * Object serialization / Deserialization
 */
describe('Flash Buffer Schema tests', () => {
    /* Describe schema */
    class Player {
        @field({ type: 'uint32' }) id: number = 0;
        @field({ type: 'string' }) name: string = '';
        @field({ type: 'float64' }) x: number = 0;
        @field({ type: 'float64' }) y: number = 0;
        @field({ type: 'varint' }) vint : number = 0;
        @field({ type: 'bool' }) isEnabled : boolean = false;
    }

    // Create and fill data
    let player : Player;
    beforeAll(()=>{
        player = new Player();
        player.id = 1;
        player.name = 'Elijah';
        player.x = 55.2
        player.y = 21.11;
        player.vint = 5991;
        player.isEnabled  = true;
    });

    it('Serialize and Deserialize schema', ()=> {
        let serialized = FlashBufferSchema.serialize(player);
        let deserialized = FlashBufferSchema.deserialize(Player, serialized.reset());
        expect(deserialized).toEqual(player);
    });

    it('Serialize and Deserialize using Uint8 Array', ()=> {
        let serialized = FlashBufferSchema.serialize(player).toUint8Array();
        let deserialized = FlashBufferSchema.deserialize(Player, FlashBuffer.fromUint8Array(serialized));
        expect(deserialized).toEqual(player);
    });
})